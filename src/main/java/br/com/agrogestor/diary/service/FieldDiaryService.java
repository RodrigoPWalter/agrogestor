package br.com.agrogestor.diary.service;

import br.com.agrogestor.diary.dto.FieldDiaryRequest;
import br.com.agrogestor.diary.dto.FieldDiaryResponse;
import br.com.agrogestor.diary.entity.FieldDiaryEntry;
import br.com.agrogestor.diary.repository.FieldDiaryRepository;
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

@Service
public class FieldDiaryService {

    private final FieldDiaryRepository diaryRepository;
    private final PlantingRepository plantingRepository;

    public FieldDiaryService(
            FieldDiaryRepository diaryRepository,
            PlantingRepository plantingRepository
    ) {
        this.diaryRepository = diaryRepository;
        this.plantingRepository = plantingRepository;
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
        return toResponse(diaryRepository.save(entry));
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
                entry.getObservations(),
                entry.getCreatedAt(),
                entry.getUpdatedAt()
        );
    }

    private String normalize(String value) {
        return value.trim().replaceAll("\\s+", " ");
    }

    private String normalizeNullable(String value) {
        return value == null || value.isBlank() ? null : normalize(value);
    }
}
