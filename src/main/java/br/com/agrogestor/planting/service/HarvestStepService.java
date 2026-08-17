package br.com.agrogestor.planting.service;

import br.com.agrogestor.diary.entity.ActivityType;
import br.com.agrogestor.diary.entity.FieldDiaryEntry;
import br.com.agrogestor.diary.repository.FieldDiaryRepository;
import br.com.agrogestor.planting.dto.HarvestStepRequest;
import br.com.agrogestor.planting.dto.HarvestStepResponse;
import br.com.agrogestor.planting.entity.HarvestStep;
import br.com.agrogestor.planting.entity.Planting;
import br.com.agrogestor.planting.entity.PlantingStatus;
import br.com.agrogestor.planting.repository.HarvestStepRepository;
import br.com.agrogestor.planting.repository.PlantingRepository;
import br.com.agrogestor.planting.repository.PlantingStepRepository;
import br.com.agrogestor.shared.exception.BusinessRuleException;
import br.com.agrogestor.shared.exception.ResourceNotFoundException;
import br.com.agrogestor.property.service.CurrentPropertyService;
import br.com.agrogestor.production.service.ProductionBalanceService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;

@Service
public class HarvestStepService {

    private final HarvestStepRepository harvestRepository;
    private final PlantingStepRepository plantingStepRepository;
    private final PlantingRepository plantingRepository;
    private final FieldDiaryRepository diaryRepository;
    private final CurrentPropertyService currentProperty;
    private final ProductionBalanceService productionBalance;

    public HarvestStepService(
            HarvestStepRepository harvestRepository,
            PlantingStepRepository plantingStepRepository,
            PlantingRepository plantingRepository,
            FieldDiaryRepository diaryRepository,
            CurrentPropertyService currentProperty,
            ProductionBalanceService productionBalance
    ) {
        this.harvestRepository = harvestRepository;
        this.plantingStepRepository = plantingStepRepository;
        this.plantingRepository = plantingRepository;
        this.diaryRepository = diaryRepository;
        this.currentProperty = currentProperty;
        this.productionBalance = productionBalance;
    }

    @Transactional
    public HarvestStepResponse create(UUID plantingId, HarvestStepRequest request) {
        Planting planting = findPlantingForUpdate(plantingId);
        validateStep(
                planting,
                request,
                plantedArea(plantingId),
                harvestedArea(plantingId),
                BigDecimal.ZERO
        );
        String seedVariety = effectiveSeedVariety(planting, request.seedVariety());

        HarvestStep step = harvestRepository.save(new HarvestStep(
                planting,
                request.harvestDate(),
                area(request.harvestedAreaHectares()),
                quantity(request.harvestQuantity()),
                request.harvestUnit(),
                seedVariety,
                request.startTime(),
                request.endTime(),
                normalizeNullable(request.observations())
        ));
        FieldDiaryEntry diaryEntry = saveDiaryEntry(
                null,
                planting,
                request
        );
        step.linkDiaryEntry(diaryEntry.getId());
        return toResponse(step);
    }

    @Transactional(readOnly = true)
    public List<HarvestStepResponse> findAll(UUID plantingId) {
        findPlanting(plantingId);
        return harvestRepository
                .findByPlantingIdOrderByHarvestDateAscCreatedAtAsc(plantingId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public HarvestStepResponse findById(UUID plantingId, UUID stepId) {
        findPlanting(plantingId);
        return toResponse(findStep(plantingId, stepId));
    }

    @Transactional
    public HarvestStepResponse update(
            UUID plantingId,
            UUID stepId,
            HarvestStepRequest request
    ) {
        Planting planting = findPlantingForUpdate(plantingId);
        HarvestStep step = findStep(plantingId, stepId);
        validateStep(
                planting,
                request,
                plantedArea(plantingId),
                harvestedArea(plantingId),
                step.getHarvestedAreaHectares()
        );
        productionBalance.ensureHarvestChangeKeepsSoldStock(
                plantingId,
                step.getHarvestUnit(),
                step.getHarvestQuantity(),
                request.harvestUnit(),
                request.harvestQuantity()
        );

        step.update(
                request.harvestDate(),
                area(request.harvestedAreaHectares()),
                quantity(request.harvestQuantity()),
                request.harvestUnit(),
                effectiveSeedVariety(planting, request.seedVariety()),
                request.startTime(),
                request.endTime(),
                normalizeNullable(request.observations())
        );
        FieldDiaryEntry diaryEntry = saveDiaryEntry(
                step.getDiaryEntryId(),
                planting,
                request
        );
        step.linkDiaryEntry(diaryEntry.getId());
        return toResponse(step);
    }

    @Transactional
    public void delete(UUID plantingId, UUID stepId) {
        Planting planting = findPlantingForUpdate(plantingId);
        validatePlantingIsActive(planting);
        HarvestStep step = findStep(plantingId, stepId);
        productionBalance.ensureHarvestChangeKeepsSoldStock(
                plantingId,
                step.getHarvestUnit(),
                step.getHarvestQuantity(),
                step.getHarvestUnit(),
                BigDecimal.ZERO
        );
        UUID diaryEntryId = step.getDiaryEntryId();

        harvestRepository.delete(step);
        harvestRepository.flush();
        if (diaryEntryId != null) {
            diaryRepository.findById(diaryEntryId).ifPresent(diaryRepository::delete);
        }
    }

    private void validateStep(
            Planting planting,
            HarvestStepRequest request,
            BigDecimal plantedArea,
            BigDecimal currentHarvestedArea,
            BigDecimal areaBeingReplaced
    ) {
        validatePlantingIsActive(planting);
        if (plantedArea.signum() == 0) {
            throw new BusinessRuleException(
                    "Registre os hectares plantados antes de iniciar a colheita"
            );
        }
        if (request.harvestDate().isBefore(planting.getStartDate())) {
            throw new BusinessRuleException(
                    "A data da colheita não pode ser anterior ao início do plantio"
            );
        }
        if (request.startTime() != null
                && request.endTime() != null
                && request.endTime().isBefore(request.startTime())) {
            throw new BusinessRuleException(
                    "O horário de término não pode ser anterior ao horário de início"
            );
        }

        BigDecimal totalWithoutCurrent = currentHarvestedArea.subtract(areaBeingReplaced);
        BigDecimal remainingArea = plantedArea
                .subtract(totalWithoutCurrent)
                .max(BigDecimal.ZERO);
        if (request.harvestedAreaHectares().compareTo(remainingArea) > 0) {
            throw new BusinessRuleException(
                    "Você informou "
                            + display(request.harvestedAreaHectares())
                            + " hectares, mas restam apenas "
                            + display(remainingArea)
                            + " hectares para colher"
            );
        }
    }

    private void validatePlantingIsActive(Planting planting) {
        if (planting.getStatus() == PlantingStatus.HARVESTED) {
            throw new BusinessRuleException(
                    "Não é possível alterar a colheita de uma safra finalizada"
            );
        }
    }

    private FieldDiaryEntry saveDiaryEntry(
            UUID diaryEntryId,
            Planting planting,
            HarvestStepRequest request
    ) {
        FieldDiaryEntry diaryEntry = diaryEntryId == null
                ? null
                : diaryRepository.findById(diaryEntryId).orElse(null);
        String activity = "Colheita realizada: "
                + display(request.harvestedAreaHectares())
                + " ha, produção de "
                + display(request.harvestQuantity())
                + " "
                + request.harvestUnit().getDisplayName();
        String observations = normalizeNullable(request.observations());

        if (diaryEntry == null) {
            diaryEntry = new FieldDiaryEntry(
                    currentProperty.get(),
                    planting,
                    request.harvestDate(),
                    ActivityType.HARVEST,
                    activity,
                    null,
                    null,
                    observations
            );
            diaryEntry.updateDetails(
                    null,
                    null,
                    null,
                    null,
                    quantity(request.harvestQuantity()),
                    request.harvestUnit().getDisplayName(),
                    null
            );
            return diaryRepository.save(diaryEntry);
        }

        diaryEntry.update(
                planting,
                request.harvestDate(),
                ActivityType.HARVEST,
                activity,
                null,
                null,
                observations
        );
        diaryEntry.updateDetails(
                null,
                null,
                null,
                null,
                quantity(request.harvestQuantity()),
                request.harvestUnit().getDisplayName(),
                null
        );
        return diaryEntry;
    }

    private Planting findPlanting(UUID plantingId) {
        return plantingRepository.findByIdAndPropertyId(plantingId, currentProperty.id())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Plantio não encontrado com o ID " + plantingId
                ));
    }

    private Planting findPlantingForUpdate(UUID plantingId) {
        return plantingRepository.findByIdAndPropertyIdForUpdate(
                        plantingId, currentProperty.id())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Plantio não encontrado com o ID " + plantingId
                ));
    }

    private HarvestStep findStep(UUID plantingId, UUID stepId) {
        return harvestRepository.findByIdAndPlantingId(stepId, plantingId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Etapa de colheita não encontrada neste plantio"
                ));
    }

    private BigDecimal plantedArea(UUID plantingId) {
        BigDecimal total = plantingStepRepository.sumAreaByPlantingId(plantingId);
        return total == null ? BigDecimal.ZERO : total;
    }

    private BigDecimal harvestedArea(UUID plantingId) {
        BigDecimal total = harvestRepository.sumAreaByPlantingId(plantingId);
        return total == null ? BigDecimal.ZERO : total;
    }

    private HarvestStepResponse toResponse(HarvestStep step) {
        return new HarvestStepResponse(
                step.getId(),
                step.getPlanting().getId(),
                step.getHarvestDate(),
                step.getHarvestedAreaHectares(),
                step.getHarvestQuantity(),
                step.getHarvestUnit(),
                step.getHarvestUnit().getDisplayName(),
                step.getSeedVariety(),
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

    private BigDecimal quantity(BigDecimal value) {
        return value.setScale(3, RoundingMode.HALF_UP);
    }

    private String effectiveSeedVariety(Planting planting, String seedVariety) {
        return seedVariety == null || seedVariety.isBlank()
                ? planting.getSeedVariety()
                : normalize(seedVariety);
    }

    private String normalizeNullable(String value) {
        return value == null || value.isBlank() ? null : normalize(value);
    }

    private String normalize(String value) {
        return value.trim().replaceAll("\\s+", " ");
    }

    private String display(BigDecimal value) {
        return value.stripTrailingZeros().toPlainString().replace(".", ",");
    }
}
