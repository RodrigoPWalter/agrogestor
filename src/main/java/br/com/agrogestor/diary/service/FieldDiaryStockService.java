package br.com.agrogestor.diary.service;

import br.com.agrogestor.diary.dto.FieldDiaryRequest;
import br.com.agrogestor.diary.entity.ActivityType;
import br.com.agrogestor.diary.entity.FieldDiaryEntry;
import br.com.agrogestor.diary.entity.FieldDiaryProduct;
import br.com.agrogestor.diary.repository.FieldDiaryProductRepository;
import br.com.agrogestor.inventory.entity.InventoryMovement;
import br.com.agrogestor.inventory.entity.InventoryMovementCost;
import br.com.agrogestor.inventory.entity.InventoryProduct;
import br.com.agrogestor.inventory.entity.MeasurementUnit;
import br.com.agrogestor.inventory.entity.MovementType;
import br.com.agrogestor.inventory.entity.ProductType;
import br.com.agrogestor.inventory.repository.InventoryMovementRepository;
import br.com.agrogestor.inventory.repository.InventoryProductRepository;
import br.com.agrogestor.property.service.CurrentPropertyService;
import br.com.agrogestor.shared.exception.BusinessRuleException;
import br.com.agrogestor.shared.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.UUID;

@Service
public class FieldDiaryStockService {

    private final FieldDiaryProductRepository diaryProductRepository;
    private final InventoryProductRepository inventoryRepository;
    private final InventoryMovementRepository movementRepository;
    private final CurrentPropertyService currentProperty;

    public FieldDiaryStockService(
            FieldDiaryProductRepository diaryProductRepository,
            InventoryProductRepository inventoryRepository,
            InventoryMovementRepository movementRepository,
            CurrentPropertyService currentProperty
    ) {
        this.diaryProductRepository = diaryProductRepository;
        this.inventoryRepository = inventoryRepository;
        this.movementRepository = movementRepository;
        this.currentProperty = currentProperty;
    }

    public List<FieldDiaryProduct> replaceProducts(
            FieldDiaryEntry entry,
            FieldDiaryRequest request
    ) {
        if (entry.getId() == null) return List.of();

        removeProducts(entry, "Estorno por edição no diário: ");
        MovementType type = request.activityType() == ActivityType.PRODUCT_PURCHASE
                ? MovementType.ENTRY : MovementType.EXIT;
        var quantities = requestedQuantities(request);
        BigDecimal purchaseCost = type == MovementType.ENTRY
                ? moneyOrZero(request.amount()) : BigDecimal.ZERO;
        if (purchaseCost.signum() > 0 && quantities.size() != 1) {
            throw new BusinessRuleException(
                    "Para calcular o custo do estoque, registre um produto por compra"
            );
        }

        List<FieldDiaryProduct> savedProducts = new ArrayList<>();
        quantities.forEach((productId, quantity) -> savedProducts.add(
                applyProductMovement(entry, productId, quantity, type, purchaseCost)));
        return savedProducts;
    }

    public void removeProducts(FieldDiaryEntry entry, String notePrefix) {
        List<FieldDiaryProduct> products = diaryProductRepository.findByEntryId(entry.getId());
        restoreStock(products, entry, notePrefix);
        diaryProductRepository.deleteByEntryId(entry.getId());
        diaryProductRepository.flush();
    }

    private LinkedHashMap<UUID, BigDecimal> requestedQuantities(FieldDiaryRequest request) {
        var quantities = new LinkedHashMap<UUID, BigDecimal>();
        if (request.products() != null) {
            request.products().forEach(item ->
                    quantities.merge(item.productId(), item.quantity(), BigDecimal::add));
        }
        if (request.productId() != null && request.quantity() != null) {
            quantities.merge(request.productId(), request.quantity(), BigDecimal::add);
        }
        if (request.activityType() == ActivityType.PRODUCT_PURCHASE
                && request.productId() == null && request.quantity() != null) {
            InventoryProduct created = findOrCreateProduct(request);
            quantities.merge(created.getId(), request.quantity(), BigDecimal::add);
        }
        return quantities;
    }

    private InventoryProduct findOrCreateProduct(FieldDiaryRequest request) {
        String name = normalize(request.productName());
        return inventoryRepository.findFirstByPropertyIdAndNameIgnoreCase(
                currentProperty.id(), name).orElseGet(() -> {
            ProductType productType = request.productType() == null
                    ? ProductType.PESTICIDE : request.productType();
            MeasurementUnit unit = request.unit() == null
                    ? MeasurementUnit.UNIT : request.unit();
            return inventoryRepository.save(new InventoryProduct(
                    currentProperty.get(), name, productType, BigDecimal.ZERO,
                    unit, BigDecimal.ZERO, null));
        });
    }

    private FieldDiaryProduct applyProductMovement(
            FieldDiaryEntry entry,
            UUID productId,
            BigDecimal quantity,
            MovementType type,
            BigDecimal entryCost
    ) {
        InventoryProduct product = inventoryRepository.findByIdAndPropertyIdForUpdate(
                        productId, currentProperty.id())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Produto não encontrado com o ID " + productId));
        InventoryMovementCost cost = type == MovementType.ENTRY
                ? product.applyEntry(quantity, entryCost)
                : product.applyExit(quantity);
        movementRepository.save(new InventoryMovement(
                product, type, quantity, entry.getEntryDate(),
                entry.getActivityType().getDisplayName() + " pelo diário",
                cost.unitCost(), cost.totalCost()));
        FieldDiaryProduct diaryProduct = new FieldDiaryProduct(
                entry, product, quantity, type, cost.unitCost(), cost.totalCost());
        diaryProductRepository.save(diaryProduct);
        return diaryProduct;
    }

    private void restoreStock(
            List<FieldDiaryProduct> products,
            FieldDiaryEntry entry,
            String notePrefix
    ) {
        products.stream().filter(FieldDiaryProduct::isStockDeducted).forEach(item -> {
            InventoryProduct product = inventoryRepository.findByIdAndPropertyIdForUpdate(
                            item.getProduct().getId(), currentProperty.id())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Produto não encontrado com o ID " + item.getProduct().getId()));
            MovementType reverse = item.getMovementType() == MovementType.ENTRY
                    ? MovementType.EXIT : MovementType.ENTRY;
            product.reverseMovement(
                    item.getMovementType(), item.getQuantity(), item.getTotalCost());
            movementRepository.save(new InventoryMovement(
                    product, reverse, item.getQuantity(), entry.getEntryDate(),
                    notePrefix + entry.getActivity(),
                    item.getUnitCost(), item.getTotalCost()));
        });
    }

    private BigDecimal moneyOrZero(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private String normalize(String value) {
        return value.trim().replaceAll("\\s+", " ");
    }
}
