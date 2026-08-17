package br.com.agrogestor.production.service;

import br.com.agrogestor.diary.entity.ActivityType;
import br.com.agrogestor.diary.entity.FieldDiaryEntry;
import br.com.agrogestor.diary.repository.FieldDiaryRepository;
import br.com.agrogestor.planting.entity.HarvestStep;
import br.com.agrogestor.planting.entity.HarvestUnit;
import br.com.agrogestor.planting.repository.HarvestStepRepository;
import br.com.agrogestor.production.repository.ProductionSaleRepository;
import br.com.agrogestor.shared.exception.BusinessRuleException;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class ProductionBalanceService {

    private static final BigDecimal BAG_WEIGHT_KILOGRAMS = new BigDecimal("60");

    private final HarvestStepRepository harvestRepository;
    private final FieldDiaryRepository diaryRepository;
    private final ProductionSaleRepository saleRepository;

    public ProductionBalanceService(
            HarvestStepRepository harvestRepository,
            FieldDiaryRepository diaryRepository,
            ProductionSaleRepository saleRepository
    ) {
        this.harvestRepository = harvestRepository;
        this.diaryRepository = diaryRepository;
        this.saleRepository = saleRepository;
    }

    public BigDecimal harvestedBags(UUID plantingId) {
        List<HarvestStep> steps = harvestRepository
                .findByPlantingIdOrderByHarvestDateAscCreatedAtAsc(plantingId);
        Set<UUID> linkedDiaryEntries = linkedDiaryEntries(steps);
        BigDecimal total = steps.stream()
                .map(step -> toBags(step.getHarvestQuantity(), step.getHarvestUnit()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal legacyTotal = diaryRepository
                .findByPlantingIdAndActivityType(plantingId, ActivityType.HARVEST)
                .stream()
                .filter(entry -> !linkedDiaryEntries.contains(entry.getId()))
                .map(this::toBags)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return quantity(total.add(legacyTotal));
    }

    public Map<UUID, BigDecimal> harvestedBagsByProperty(UUID propertyId) {
        List<HarvestStep> steps = harvestRepository.findByPlantingPropertyId(propertyId);
        Map<UUID, BigDecimal> totals = new HashMap<>();
        Set<UUID> linkedDiaryEntries = linkedDiaryEntries(steps);
        steps.forEach(step -> totals.merge(
                step.getPlanting().getId(),
                toBags(step.getHarvestQuantity(), step.getHarvestUnit()),
                BigDecimal::add
        ));
        diaryRepository.findByPropertyIdAndActivityType(propertyId, ActivityType.HARVEST)
                .stream()
                .filter(entry -> entry.getPlanting() != null)
                .filter(entry -> !linkedDiaryEntries.contains(entry.getId()))
                .forEach(entry -> totals.merge(
                        entry.getPlanting().getId(),
                        toBags(entry),
                        BigDecimal::add
                ));
        totals.replaceAll((ignored, value) -> quantity(value));
        return totals;
    }

    public BigDecimal soldBags(UUID plantingId) {
        BigDecimal sold = saleRepository.sumQuantityByPlantingId(plantingId);
        return quantity(sold == null ? BigDecimal.ZERO : sold);
    }

    public BigDecimal availableBags(UUID plantingId) {
        return quantity(harvestedBags(plantingId).subtract(soldBags(plantingId)));
    }

    public void ensureSaleFitsStock(UUID plantingId, BigDecimal quantityToSell) {
        BigDecimal available = availableBags(plantingId);
        if (quantityToSell.compareTo(available) > 0) {
            throw new BusinessRuleException(
                    "Você informou " + display(quantityToSell)
                            + " sacas, mas há apenas " + display(available)
                            + " sacas disponíveis para venda"
            );
        }
    }

    public void ensureHarvestChangeKeepsSoldStock(
            UUID plantingId,
            HarvestUnit previousUnit,
            BigDecimal previousQuantity,
            HarvestUnit newUnit,
            BigDecimal newQuantity
    ) {
        BigDecimal resultingHarvest = harvestedBags(plantingId)
                .subtract(toBags(previousQuantity, previousUnit))
                .add(toBags(newQuantity, newUnit));
        BigDecimal sold = soldBags(plantingId);
        if (resultingHarvest.compareTo(sold) < 0) {
            throw new BusinessRuleException(
                    "Esta alteração deixaria a produção abaixo das "
                            + display(sold) + " sacas que já foram vendidas"
            );
        }
    }

    private Set<UUID> linkedDiaryEntries(List<HarvestStep> steps) {
        Set<UUID> linked = new HashSet<>();
        steps.stream()
                .map(HarvestStep::getDiaryEntryId)
                .filter(java.util.Objects::nonNull)
                .forEach(linked::add);
        return linked;
    }

    private BigDecimal toBags(FieldDiaryEntry entry) {
        if (entry.getHarvestQuantity() == null || entry.getHarvestUnit() == null) {
            return BigDecimal.ZERO;
        }
        String unit = entry.getHarvestUnit().trim().toLowerCase(Locale.ROOT);
        if (unit.contains("saca") || unit.equals("sc")) {
            return entry.getHarvestQuantity();
        }
        if (unit.equals("kg") || unit.contains("quilograma")) {
            return entry.getHarvestQuantity().divide(
                    BAG_WEIGHT_KILOGRAMS, 3, RoundingMode.HALF_UP);
        }
        if (unit.equals("t") || unit.contains("tonelada")) {
            return entry.getHarvestQuantity().multiply(new BigDecimal("1000"))
                    .divide(BAG_WEIGHT_KILOGRAMS, 3, RoundingMode.HALF_UP);
        }
        return BigDecimal.ZERO;
    }

    private BigDecimal toBags(BigDecimal value, HarvestUnit unit) {
        return unit.toKilograms(value)
                .divide(BAG_WEIGHT_KILOGRAMS, 3, RoundingMode.HALF_UP);
    }

    private BigDecimal quantity(BigDecimal value) {
        return value.setScale(3, RoundingMode.HALF_UP);
    }

    private String display(BigDecimal value) {
        return value.stripTrailingZeros().toPlainString().replace(".", ",");
    }
}
