package br.com.agrogestor.planting.service;

import br.com.agrogestor.diary.entity.ActivityType;
import br.com.agrogestor.diary.entity.FieldDiaryEntry;
import br.com.agrogestor.diary.repository.FieldDiaryRepository;
import br.com.agrogestor.planting.dto.PlantingStepRequest;
import br.com.agrogestor.planting.dto.PlantingStepResponse;
import br.com.agrogestor.planting.entity.Planting;
import br.com.agrogestor.planting.entity.PlantingStatus;
import br.com.agrogestor.planting.entity.PlantingStep;
import br.com.agrogestor.planting.repository.PlantingRepository;
import br.com.agrogestor.planting.repository.PlantingStepRepository;
import br.com.agrogestor.shared.exception.BusinessRuleException;
import br.com.agrogestor.shared.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;

@Service
public class PlantingStepService {

    private final PlantingStepRepository stepRepository;
    private final PlantingRepository plantingRepository;
    private final FieldDiaryRepository diaryRepository;

    public PlantingStepService(
            PlantingStepRepository stepRepository,
            PlantingRepository plantingRepository,
            FieldDiaryRepository diaryRepository
    ) {
        this.stepRepository = stepRepository;
        this.plantingRepository = plantingRepository;
        this.diaryRepository = diaryRepository;
    }

    @Transactional
    public PlantingStepResponse create(UUID plantingId, PlantingStepRequest request) {
        Planting planting = findPlantingForUpdate(plantingId);
        validateStep(planting, request, totalArea(plantingId), BigDecimal.ZERO);
        String seedVariety = effectiveSeedVariety(planting, request.seedVariety());

        PlantingStep step = stepRepository.save(new PlantingStep(
                planting,
                request.stepDate(),
                area(request.plantedAreaHectares()),
                seedVariety,
                request.startTime(),
                request.endTime(),
                normalizeNullable(request.observations())
        ));
        FieldDiaryEntry diaryEntry = saveDiaryEntry(
                null,
                planting,
                request,
                seedVariety
        );
        step.linkDiaryEntry(diaryEntry.getId());
        return toResponse(step);
    }

    @Transactional(readOnly = true)
    public List<PlantingStepResponse> findAll(UUID plantingId) {
        findPlanting(plantingId);
        return stepRepository
                .findByPlantingIdOrderByStepDateAscCreatedAtAsc(plantingId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PlantingStepResponse findById(UUID plantingId, UUID stepId) {
        findPlanting(plantingId);
        return toResponse(findStep(plantingId, stepId));
    }

    @Transactional
    public PlantingStepResponse update(
            UUID plantingId,
            UUID stepId,
            PlantingStepRequest request
    ) {
        Planting planting = findPlantingForUpdate(plantingId);
        PlantingStep step = findStep(plantingId, stepId);
        String seedVariety = effectiveSeedVariety(planting, request.seedVariety());
        validateStep(
                planting,
                request,
                totalArea(plantingId),
                step.getPlantedAreaHectares()
        );

        step.update(
                request.stepDate(),
                area(request.plantedAreaHectares()),
                seedVariety,
                request.startTime(),
                request.endTime(),
                normalizeNullable(request.observations())
        );
        FieldDiaryEntry diaryEntry = saveDiaryEntry(
                step.getDiaryEntryId(),
                planting,
                request,
                seedVariety
        );
        step.linkDiaryEntry(diaryEntry.getId());
        return toResponse(step);
    }

    @Transactional
    public void delete(UUID plantingId, UUID stepId) {
        Planting planting = findPlantingForUpdate(plantingId);
        validatePlantingIsActive(planting);
        PlantingStep step = findStep(plantingId, stepId);
        UUID diaryEntryId = step.getDiaryEntryId();

        stepRepository.delete(step);
        stepRepository.flush();
        if (diaryEntryId != null) {
            diaryRepository.findById(diaryEntryId).ifPresent(diaryRepository::delete);
        }
    }

    private void validateStep(
            Planting planting,
            PlantingStepRequest request,
            BigDecimal currentTotal,
            BigDecimal areaBeingReplaced
    ) {
        validatePlantingIsActive(planting);
        if (request.stepDate().isBefore(planting.getStartDate())) {
            throw new BusinessRuleException(
                    "A data da etapa não pode ser anterior ao início do plantio"
            );
        }
        if (request.startTime() != null
                && request.endTime() != null
                && request.endTime().isBefore(request.startTime())) {
            throw new BusinessRuleException(
                    "O horário de término não pode ser anterior ao horário de início"
            );
        }

        BigDecimal totalWithoutCurrent = currentTotal.subtract(areaBeingReplaced);
        BigDecimal remainingArea = planting.getPlannedAreaHectares()
                .subtract(totalWithoutCurrent)
                .max(BigDecimal.ZERO);
        if (request.plantedAreaHectares().compareTo(remainingArea) > 0) {
            throw new BusinessRuleException(
                    "Você informou "
                            + displayArea(request.plantedAreaHectares())
                            + " hectares, mas restam apenas "
                            + displayArea(remainingArea)
                            + " hectares para completar a área prevista"
            );
        }
    }

    private void validatePlantingIsActive(Planting planting) {
        if (planting.getStatus() == PlantingStatus.HARVESTED) {
            throw new BusinessRuleException(
                    "Não é possível alterar etapas de um plantio finalizado"
            );
        }
    }

    private FieldDiaryEntry saveDiaryEntry(
            UUID diaryEntryId,
            Planting planting,
            PlantingStepRequest request,
            String seedVariety
    ) {
        FieldDiaryEntry diaryEntry = diaryEntryId == null
                ? null
                : diaryRepository.findById(diaryEntryId).orElse(null);
        String activity = buildDiaryActivity(
                planting,
                request.plantedAreaHectares(),
                seedVariety
        );
        String observations = normalizeNullable(request.observations());

        if (diaryEntry == null) {
            return diaryRepository.save(new FieldDiaryEntry(
                    planting,
                    request.stepDate(),
                    ActivityType.PLANTING,
                    activity,
                    null,
                    null,
                    observations
            ));
        }

        diaryEntry.update(
                planting,
                request.stepDate(),
                ActivityType.PLANTING,
                activity,
                null,
                null,
                observations
        );
        return diaryEntry;
    }

    private String buildDiaryActivity(
            Planting planting,
            BigDecimal plantedArea,
            String seedVariety
    ) {
        String location = planting.getFieldName() == null
                ? ""
                : " em " + planting.getFieldName();
        return "Plantio realizado: "
                + displayArea(plantedArea)
                + " hectares plantados"
                + location
                + " com a variedade "
                + normalize(seedVariety);
    }

    private Planting findPlanting(UUID plantingId) {
        return plantingRepository.findById(plantingId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Plantio não encontrado com o ID " + plantingId
                ));
    }

    private Planting findPlantingForUpdate(UUID plantingId) {
        return plantingRepository.findByIdForUpdate(plantingId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Plantio não encontrado com o ID " + plantingId
                ));
    }

    private PlantingStep findStep(UUID plantingId, UUID stepId) {
        return stepRepository.findByIdAndPlantingId(stepId, plantingId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Etapa de plantio não encontrada neste plantio"
                ));
    }

    private BigDecimal totalArea(UUID plantingId) {
        BigDecimal total = stepRepository.sumAreaByPlantingId(plantingId);
        return total == null ? BigDecimal.ZERO : total;
    }

    private PlantingStepResponse toResponse(PlantingStep step) {
        return new PlantingStepResponse(
                step.getId(),
                step.getPlanting().getId(),
                step.getStepDate(),
                step.getPlantedAreaHectares(),
                step.getSeedVariety() == null
                        ? step.getPlanting().getSeedVariety()
                        : step.getSeedVariety(),
                step.getStartTime(),
                step.getEndTime(),
                step.getObservations(),
                step.getCreatedAt(),
                step.getUpdatedAt()
        );
    }

    private BigDecimal area(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }

    private String displayArea(BigDecimal value) {
        return value.stripTrailingZeros().toPlainString().replace(".", ",");
    }

    private String normalizeNullable(String value) {
        return value == null || value.isBlank()
                ? null
                : normalize(value);
    }

    private String normalize(String value) {
        return value.trim().replaceAll("\\s+", " ");
    }

    private String effectiveSeedVariety(Planting planting, String seedVariety) {
        return seedVariety == null || seedVariety.isBlank()
                ? planting.getSeedVariety()
                : normalize(seedVariety);
    }
}
