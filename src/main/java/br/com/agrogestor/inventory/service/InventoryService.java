package br.com.agrogestor.inventory.service;

import br.com.agrogestor.inventory.dto.InventoryMovementRequest;
import br.com.agrogestor.inventory.dto.InventoryMovementResponse;
import br.com.agrogestor.inventory.dto.InventoryProductRequest;
import br.com.agrogestor.inventory.dto.InventoryProductResponse;
import br.com.agrogestor.inventory.dto.InventoryProductUpdateRequest;
import br.com.agrogestor.inventory.dto.InventoryValuationAdjustmentRequest;
import br.com.agrogestor.inventory.dto.InventoryValuationAdjustmentResponse;
import br.com.agrogestor.inventory.entity.InventoryMovement;
import br.com.agrogestor.inventory.entity.InventoryMovementCost;
import br.com.agrogestor.inventory.entity.InventoryProduct;
import br.com.agrogestor.inventory.entity.MovementType;
import br.com.agrogestor.inventory.entity.InventoryValuationAdjustment;
import br.com.agrogestor.inventory.repository.InventoryMovementRepository;
import br.com.agrogestor.inventory.repository.InventoryProductRepository;
import br.com.agrogestor.inventory.repository.InventoryValuationAdjustmentRepository;
import br.com.agrogestor.shared.exception.ResourceNotFoundException;
import br.com.agrogestor.property.service.CurrentPropertyService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class InventoryService {

    private final InventoryProductRepository productRepository;
    private final InventoryMovementRepository movementRepository;
    private final InventoryValuationAdjustmentRepository valuationRepository;
    private final CurrentPropertyService currentProperty;

    public InventoryService(InventoryProductRepository productRepository,
                            InventoryMovementRepository movementRepository,
                            InventoryValuationAdjustmentRepository valuationRepository,
                            CurrentPropertyService currentProperty) {
        this.productRepository = productRepository;
        this.movementRepository = movementRepository;
        this.valuationRepository = valuationRepository;
        this.currentProperty = currentProperty;
    }

    @Transactional
    public InventoryProductResponse create(InventoryProductRequest request) {
        InventoryProduct product = new InventoryProduct(
                currentProperty.get(),
                normalize(request.name()), request.productType(), quantity(request.initialQuantity()),
                request.unit(), quantity(request.minimumStock()), request.expirationDate()
        );
        InventoryProduct savedProduct = productRepository.save(product);

        if (savedProduct.getQuantity().signum() > 0) {
            movementRepository.save(new InventoryMovement(
                    savedProduct,
                    MovementType.ENTRY,
                    savedProduct.getQuantity(),
                    LocalDate.now(),
                    "Saldo inicial"
            ));
        }

        return toResponse(savedProduct);
    }

    @Transactional(readOnly = true)
    public List<InventoryProductResponse> findAll() {
        return productRepository.findByPropertyIdOrderByName(currentProperty.id())
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public InventoryProductResponse findById(UUID id) {
        return toResponse(findProduct(id));
    }

    @Transactional
    public InventoryProductResponse update(UUID id, InventoryProductUpdateRequest request) {
        InventoryProduct product = findProductForUpdate(id);
        product.update(normalize(request.name()), request.productType(), request.unit(),
                quantity(request.minimumStock()), request.expirationDate());
        return toResponse(product);
    }

    @Transactional
    public void delete(UUID id) {
        productRepository.delete(findProductForUpdate(id));
    }

    @Transactional
    public InventoryProductResponse move(UUID id, InventoryMovementRequest request) {
        InventoryProduct product = findProductForUpdate(id);
        BigDecimal amount = quantity(request.quantity());
        InventoryMovementCost cost = request.movementType() == MovementType.ENTRY
                ? product.applyEntry(amount, BigDecimal.ZERO)
                : product.applyExit(amount);
        movementRepository.save(new InventoryMovement(
                product, request.movementType(), amount, request.movementDate(),
                normalizeNullable(request.notes()), cost.unitCost(), cost.totalCost()
        ));
        return toResponse(product);
    }

    @Transactional(readOnly = true)
    public List<InventoryMovementResponse> movements(UUID productId) {
        findProduct(productId);
        return movementRepository
                .findTop50ByProductIdOrderByMovementDateDescCreatedAtDesc(productId)
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public InventoryProductResponse adjustValuation(
            UUID productId,
            InventoryValuationAdjustmentRequest request
    ) {
        InventoryProduct product = findProductForUpdate(productId);
        BigDecimal previousUnitCost = product.getAverageUnitCost();
        BigDecimal previousInventoryValue = product.getInventoryValue();
        BigDecimal newUnitCost = request.newUnitCost().setScale(6, RoundingMode.HALF_UP);

        product.adjustAverageUnitCost(newUnitCost);
        valuationRepository.save(new InventoryValuationAdjustment(
                product,
                request.adjustmentDate(),
                previousUnitCost,
                newUnitCost,
                previousInventoryValue,
                product.getInventoryValue(),
                normalize(request.reason())
        ));
        return toResponse(product);
    }

    @Transactional(readOnly = true)
    public List<InventoryValuationAdjustmentResponse> valuationAdjustments(
            UUID productId
    ) {
        findProduct(productId);
        return valuationRepository
                .findTop50ByProductIdOrderByAdjustmentDateDescCreatedAtDesc(productId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private InventoryProduct findProduct(UUID id) {
        return productRepository.findByIdAndPropertyId(id, currentProperty.id()).orElseThrow(() ->
                new ResourceNotFoundException("Produto não encontrado com o ID " + id));
    }

    private InventoryProduct findProductForUpdate(UUID id) {
        return productRepository.findByIdAndPropertyIdForUpdate(id, currentProperty.id())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Produto não encontrado com o ID " + id
                ));
    }

    private InventoryProductResponse toResponse(InventoryProduct product) {
        return new InventoryProductResponse(
                product.getId(), product.getName(), product.getProductType(),
                product.getProductType().getDisplayName(), product.getQuantity(),
                product.getUnit(), product.getUnit().getDisplayName(), product.getMinimumStock(),
                product.getExpirationDate(),
                product.getQuantity().compareTo(product.getMinimumStock()) <= 0,
                product.getExpirationDate() != null && product.getExpirationDate().isBefore(LocalDate.now()),
                product.getAverageUnitCost(), product.getInventoryValue(),
                product.getCreatedAt(), product.getUpdatedAt()
        );
    }

    private InventoryMovementResponse toResponse(InventoryMovement movement) {
        return new InventoryMovementResponse(
                movement.getId(), movement.getProduct().getId(), movement.getProduct().getName(),
                movement.getMovementType(), movement.getMovementType().getDisplayName(),
                movement.getQuantity(), movement.getMovementDate(), movement.getNotes(),
                movement.getUnitCost(), movement.getTotalCost(),
                movement.getCreatedAt()
        );
    }

    private InventoryValuationAdjustmentResponse toResponse(
            InventoryValuationAdjustment adjustment
    ) {
        return new InventoryValuationAdjustmentResponse(
                adjustment.getId(),
                adjustment.getProduct().getId(),
                adjustment.getProduct().getName(),
                adjustment.getAdjustmentDate(),
                adjustment.getPreviousUnitCost(),
                adjustment.getNewUnitCost(),
                adjustment.getPreviousInventoryValue(),
                adjustment.getNewInventoryValue(),
                adjustment.getReason(),
                adjustment.getCreatedAt()
        );
    }

    private BigDecimal quantity(BigDecimal value) {
        return value.setScale(3, RoundingMode.HALF_UP);
    }

    private String normalize(String value) {
        return value.trim().replaceAll("\\s+", " ");
    }

    private String normalizeNullable(String value) {
        return value == null || value.isBlank() ? null : normalize(value);
    }
}
