package br.com.agrogestor.diary.service;

import br.com.agrogestor.diary.dto.FieldDiaryRequest;
import br.com.agrogestor.diary.dto.FieldDiaryResponse;
import br.com.agrogestor.diary.dto.FieldDiaryProductResponse;
import br.com.agrogestor.diary.entity.FieldDiaryEntry;
import br.com.agrogestor.diary.repository.FieldDiaryRepository;
import br.com.agrogestor.diary.repository.FieldDiaryProductRepository;
import br.com.agrogestor.diary.entity.FieldDiaryProduct;
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

import java.util.UUID;
import java.util.List;

@Service
public class FieldDiaryService {

    private final FieldDiaryRepository diaryRepository;
    private final PlantingRepository plantingRepository;
    private final FieldDiaryProductRepository productApplicationRepository;
    private final InventoryProductRepository inventoryRepository;

    public FieldDiaryService(
            FieldDiaryRepository diaryRepository,
            PlantingRepository plantingRepository,
            FieldDiaryProductRepository productApplicationRepository,
            InventoryProductRepository inventoryRepository
    ) {
        this.diaryRepository = diaryRepository;
        this.plantingRepository = plantingRepository;
        this.productApplicationRepository = productApplicationRepository;
        this.inventoryRepository = inventoryRepository;
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
        replaceProducts(saved, request);
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
        entry.update(
                findPlanting(request.plantingId()),
                request.entryDate(),
                request.activityType(),
                normalize(request.activity()),
                normalizeNullable(request.weatherCondition()),
                normalizeNullable(request.appliedProducts()),
                normalizeNullable(request.observations())
        );
        replaceProducts(entry, request);
        return toResponse(entry);
    }

    @Transactional
    public void delete(UUID id) {
        diaryRepository.delete(findEntry(id));
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

    private void replaceProducts(FieldDiaryEntry entry, FieldDiaryRequest request) {
        if (entry.getId() == null) return;
        productApplicationRepository.deleteByEntryId(entry.getId());
        if (request.products() == null) return;
        request.products().forEach(item -> {
            var product = inventoryRepository.findById(item.productId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Produto não encontrado com o ID " + item.productId()));
            productApplicationRepository.save(
                    new FieldDiaryProduct(entry, product, item.quantity()));
        });
    }

    private String normalize(String value) {
        return value.trim().replaceAll("\\s+", " ");
    }

    private String normalizeNullable(String value) {
        return value == null || value.isBlank() ? null : normalize(value);
    }
}
