package br.com.agrogestor.planting.service;

import br.com.agrogestor.planting.dto.PlantingRequest;
import br.com.agrogestor.planting.dto.PlantingResponse;
import br.com.agrogestor.planting.entity.Planting;
import br.com.agrogestor.planting.entity.PlantingStatus;
import br.com.agrogestor.planting.repository.PlantingRepository;
import br.com.agrogestor.shared.dto.PageResponse;
import br.com.agrogestor.shared.exception.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class PlantingService {

    private final PlantingRepository repository;

    public PlantingService(PlantingRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public PlantingResponse create(PlantingRequest request) {
        Planting planting = new Planting(
                normalize(request.crop()),
                request.harvest().trim(),
                request.plantedAreaHectares(),
                request.plantingDate(),
                normalize(request.seedVariety()),
                request.seedQuantity(),
                normalizeNullable(request.observations())
        );
        return toResponse(repository.save(planting));
    }

    @Transactional(readOnly = true)
    public PageResponse<PlantingResponse> findAll(String harvest, int page, int size) {
        return findAll(harvest, null, page, size);
    }

    @Transactional(readOnly = true)
    public PageResponse<PlantingResponse> findAll(
            String harvest, PlantingStatus status, int page, int size) {
        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by(Sort.Direction.DESC, "plantingDate").and(Sort.by("crop"))
        );

        boolean hasHarvest = harvest != null && !harvest.isBlank();
        Page<Planting> result;
        if (status == null) {
            result = hasHarvest
                    ? repository.findByHarvestIgnoreCase(harvest.trim(), pageable)
                    : repository.findAll(pageable);
        } else {
            result = hasHarvest
                    ? repository.findByHarvestIgnoreCaseAndStatus(
                            harvest.trim(), status, pageable)
                    : repository.findByStatus(status, pageable);
        }

        return PageResponse.from(result.map(this::toResponse));
    }

    @Transactional(readOnly = true)
    public PlantingResponse findById(UUID id) {
        return toResponse(findEntity(id));
    }

    @Transactional
    public PlantingResponse update(UUID id, PlantingRequest request) {
        Planting planting = findEntity(id);
        planting.update(
                normalize(request.crop()),
                request.harvest().trim(),
                request.plantedAreaHectares(),
                request.plantingDate(),
                normalize(request.seedVariety()),
                request.seedQuantity(),
                normalizeNullable(request.observations())
        );
        return toResponse(planting);
    }

    @Transactional
    public void delete(UUID id) {
        Planting planting = findEntity(id);
        repository.delete(planting);
    }

    @Transactional
    public PlantingResponse finish(UUID id) {
        Planting planting = findEntity(id);
        planting.finish();
        return toResponse(planting);
    }

    @Transactional(readOnly = true)
    public List<String> findHarvestHistory() {
        return repository.findDistinctHarvests();
    }

    private Planting findEntity(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Plantio não encontrado com o ID " + id));
    }

    private PlantingResponse toResponse(Planting planting) {
        return new PlantingResponse(
                planting.getId(),
                planting.getCrop(),
                planting.getHarvest(),
                planting.getPlantedAreaHectares(),
                planting.getPlantingDate(),
                planting.getSeedVariety(),
                planting.getSeedQuantity(),
                planting.getObservations(),
                planting.getStatus(),
                planting.getStatus().getDisplayName(),
                planting.getCompletedAt(),
                planting.getCreatedAt(),
                planting.getUpdatedAt()
        );
    }

    private String normalize(String value) {
        return value.trim().replaceAll("\\s+", " ");
    }

    private String normalizeNullable(String value) {
        return value == null || value.isBlank() ? null : normalize(value);
    }
}
