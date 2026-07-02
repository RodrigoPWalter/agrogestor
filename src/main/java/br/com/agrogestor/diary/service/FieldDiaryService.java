package br.com.agrogestor.diary.service;

import br.com.agrogestor.diary.dto.FieldDiaryRequest;
import br.com.agrogestor.diary.dto.FieldDiaryResponse;
import br.com.agrogestor.diary.dto.FieldDiaryProductResponse;
import br.com.agrogestor.diary.entity.FieldDiaryEntry;
import br.com.agrogestor.diary.repository.FieldDiaryRepository;
import br.com.agrogestor.diary.repository.FieldDiaryProductRepository;
import br.com.agrogestor.diary.entity.FieldDiaryProduct;
import br.com.agrogestor.inventory.entity.InventoryMovement;
import br.com.agrogestor.inventory.entity.MovementType;
import br.com.agrogestor.inventory.repository.InventoryMovementRepository;
import br.com.agrogestor.inventory.repository.InventoryProductRepository;
import br.com.agrogestor.planting.entity.Planting;
import br.com.agrogestor.planting.repository.PlantingRepository;
import br.com.agrogestor.shared.dto.PageResponse;
import br.com.agrogestor.shared.exception.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.UUID;

@Service
public class FieldDiaryService {

    private final FieldDiaryRepository diaryRepository;
    private final PlantingRepository plantingRepository;
    private final FieldDiaryProductRepository productApplicationRepository;
    private final InventoryProductRepository inventoryRepository;
    private final InventoryMovementRepository movementRepository;

    public FieldDiaryService(
            FieldDiaryRepository diaryRepository,
            PlantingRepository plantingRepository,
            FieldDiaryProductRepository productApplicationRepository,
            InventoryProductRepository inventoryRepository,
            InventoryMovementRepository movementRepository
    ) {
        this.diaryRepository = diaryRepository;
        this.plantingRepository = plantingRepository;
        this.productApplicationRepository = productApplicationRepository;
        this.inventoryRepository = inventoryRepository;
        this.movementRepository = movementRepository;
    }

    @Transactional
    public FieldDiaryResponse create(FieldDiaryRequest request) {
        Planting planting = findPlanting(request.plantingId());
        FieldDiaryEntry entry = new FieldDiaryEntry(
                planting,
                request.entryDate(),
                request.activityType(),
                normalize(request.activity()),
                normalizeNullable(request.weatherCondition()),
                normalizeNullable(request.appliedProducts()),
                normalizeNullable(request.observations())
        );
        FieldDiaryEntry saved = diaryRepository.save(entry);
        replaceProducts(saved, request, List.of());
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public PageResponse<FieldDiaryResponse> findAll(UUID plantingId, int page, int size) {
        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by(Sort.Direction.DESC, "entryDate")
                        .and(Sort.by(Sort.Direction.DESC, "createdAt"))
        );
        Page<FieldDiaryEntry> entries = plantingId == null
                ? diaryRepository.findAll(pageable)
                : diaryRepository.findByPlantingId(plantingId, pageable);
        return PageResponse.from(entries.map(this::toResponse));
    }

    @Transactional(readOnly = true)
    public FieldDiaryResponse findById(UUID id) {
        return toResponse(findEntry(id));
    }

    @Transactional
    public FieldDiaryResponse update(UUID id, FieldDiaryRequest request) {
        FieldDiaryEntry entry = findEntry(id);
        List<FieldDiaryProduct> previousProducts =
                productApplicationRepository.findByEntryId(entry.getId());
        entry.update(
                findPlanting(request.plantingId()),
                request.entryDate(),
                request.activityType(),
                normalize(request.activity()),
                normalizeNullable(request.weatherCondition()),
                normalizeNullable(request.appliedProducts()),
                normalizeNullable(request.observations())
        );
        replaceProducts(entry, request, previousProducts);
        return toResponse(entry);
    }

    @Transactional
    public void delete(UUID id) {
        FieldDiaryEntry entry = findEntry(id);
        restoreStock(
                productApplicationRepository.findByEntryId(entry.getId()),
                entry,
                "Estorno por exclusão no diário: "
        );
        productApplicationRepository.deleteByEntryId(entry.getId());
        productApplicationRepository.flush();
        diaryRepository.delete(entry);
    }

    private FieldDiaryEntry findEntry(UUID id) {
        return diaryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Registro do diário não encontrado com o ID " + id
                ));
    }

    private Planting findPlanting(UUID id) {
        return plantingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Plantio não encontrado com o ID " + id
                ));
    }

    private FieldDiaryResponse toResponse(FieldDiaryEntry entry) {
        Planting planting = entry.getPlanting();
        var products = entry.getId() == null ? List.<FieldDiaryProductResponse>of()
                : productApplicationRepository.findByEntryId(entry.getId()).stream()
                .map(item -> new FieldDiaryProductResponse(
                        item.getProduct().getId(),
                        item.getProduct().getName(),
                        item.getQuantity(),
                        item.getProduct().getUnit().getDisplayName()
                ))
                .toList();
        return new FieldDiaryResponse(
                entry.getId(),
                planting.getId(),
                planting.getCrop(),
                planting.getHarvest(),
                entry.getEntryDate(),
                entry.getActivityType(),
                entry.getActivityType().getDisplayName(),
                entry.getActivity(),
                entry.getWeatherCondition(),
                entry.getAppliedProducts(),
                products,
                entry.getObservations(),
                entry.getCreatedAt(),
                entry.getUpdatedAt()
        );
    }

    private void replaceProducts(
            FieldDiaryEntry entry,
            FieldDiaryRequest request,
            List<FieldDiaryProduct> previousProducts
    ) {
        if (entry.getId() == null) return;
        restoreStock(previousProducts, entry, "Estorno por edição no diário: ");
        productApplicationRepository.deleteByEntryId(entry.getId());
        productApplicationRepository.flush();
        if (request.products() == null || request.products().isEmpty()) return;
        var quantitiesByProduct = new LinkedHashMap<UUID, BigDecimal>();
        request.products().forEach(item ->
                quantitiesByProduct.merge(item.productId(), item.quantity(), BigDecimal::add)
        );
        quantitiesByProduct.forEach((productId, quantity) -> {
            var product = inventoryRepository.findByIdForUpdate(productId)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Produto não encontrado com o ID " + productId));
            product.applyMovement(MovementType.EXIT, quantity);
            movementRepository.save(new InventoryMovement(
                    product,
                    MovementType.EXIT,
                    quantity,
                    entry.getEntryDate(),
                    "Aplicação no diário: " + entry.getActivity()
            ));
            productApplicationRepository.save(
                    new FieldDiaryProduct(entry, product, quantity));
        });
    }

    private void restoreStock(
            List<FieldDiaryProduct> applications,
            FieldDiaryEntry entry,
        String notePrefix
    ) {
        applications.stream()
                .filter(FieldDiaryProduct::isStockDeducted)
                .forEach(application -> {
            var product = inventoryRepository.findByIdForUpdate(
                            application.getProduct().getId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Produto não encontrado com o ID "
                                    + application.getProduct().getId()));
            product.applyMovement(MovementType.ENTRY, application.getQuantity());
            movementRepository.save(new InventoryMovement(
                    product,
                    MovementType.ENTRY,
                    application.getQuantity(),
                    entry.getEntryDate(),
                    notePrefix + entry.getActivity()
            ));
        });
    }

    private String normalize(String value) {
        return value.trim().replaceAll("\\s+", " ");
    }

    private String normalizeNullable(String value) {
        return value == null || value.isBlank() ? null : normalize(value);
    }
}
