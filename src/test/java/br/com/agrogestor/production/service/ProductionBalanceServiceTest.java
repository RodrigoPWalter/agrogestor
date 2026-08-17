package br.com.agrogestor.production.service;

import br.com.agrogestor.diary.entity.ActivityType;
import br.com.agrogestor.diary.repository.FieldDiaryRepository;
import br.com.agrogestor.planting.entity.HarvestStep;
import br.com.agrogestor.planting.entity.HarvestUnit;
import br.com.agrogestor.planting.entity.Planting;
import br.com.agrogestor.planting.repository.HarvestStepRepository;
import br.com.agrogestor.production.repository.ProductionSaleRepository;
import br.com.agrogestor.shared.exception.BusinessRuleException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductionBalanceServiceTest {

    @Mock
    private HarvestStepRepository harvestRepository;
    @Mock
    private FieldDiaryRepository diaryRepository;
    @Mock
    private ProductionSaleRepository saleRepository;

    private ProductionBalanceService service;

    @BeforeEach
    void setUp() {
        service = new ProductionBalanceService(
                harvestRepository, diaryRepository, saleRepository);
    }

    @Test
    void shouldConvertHarvestUnitsAndCalculateAvailableBags() {
        UUID plantingId = UUID.randomUUID();
        when(harvestRepository.findByPlantingIdOrderByHarvestDateAscCreatedAtAsc(
                plantingId)).thenReturn(List.of(
                harvestStep("100", HarvestUnit.BAGS_60_KG),
                harvestStep("600", HarvestUnit.KILOGRAMS),
                harvestStep("1.2", HarvestUnit.TONNES)
        ));
        when(diaryRepository.findByPlantingIdAndActivityType(
                plantingId, ActivityType.HARVEST)).thenReturn(List.of());
        when(saleRepository.sumQuantityByPlantingId(plantingId))
                .thenReturn(new BigDecimal("25"));

        assertThat(service.harvestedBags(plantingId))
                .isEqualByComparingTo("130.000");
        assertThat(service.availableBags(plantingId))
                .isEqualByComparingTo("105.000");
    }

    @Test
    void shouldRejectSaleGreaterThanAvailableProduction() {
        UUID plantingId = UUID.randomUUID();
        when(harvestRepository.findByPlantingIdOrderByHarvestDateAscCreatedAtAsc(
                plantingId)).thenReturn(List.of(
                harvestStep("50", HarvestUnit.BAGS_60_KG)
        ));
        when(diaryRepository.findByPlantingIdAndActivityType(
                plantingId, ActivityType.HARVEST)).thenReturn(List.of());
        when(saleRepository.sumQuantityByPlantingId(plantingId))
                .thenReturn(new BigDecimal("45"));

        assertThatThrownBy(() -> service.ensureSaleFitsStock(
                plantingId, new BigDecimal("6")))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("apenas 5 sacas disponíveis");
    }

    @Test
    void shouldProtectQuantityThatWasAlreadySoldWhenHarvestChanges() {
        UUID plantingId = UUID.randomUUID();
        when(harvestRepository.findByPlantingIdOrderByHarvestDateAscCreatedAtAsc(
                plantingId)).thenReturn(List.of(
                harvestStep("100", HarvestUnit.BAGS_60_KG)
        ));
        when(diaryRepository.findByPlantingIdAndActivityType(
                plantingId, ActivityType.HARVEST)).thenReturn(List.of());
        when(saleRepository.sumQuantityByPlantingId(plantingId))
                .thenReturn(new BigDecimal("80"));

        assertThatThrownBy(() -> service.ensureHarvestChangeKeepsSoldStock(
                plantingId,
                HarvestUnit.BAGS_60_KG,
                new BigDecimal("100"),
                HarvestUnit.BAGS_60_KG,
                new BigDecimal("70")
        )).isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("80 sacas que já foram vendidas");
    }

    private HarvestStep harvestStep(String quantity, HarvestUnit unit) {
        return new HarvestStep(
                org.mockito.Mockito.mock(Planting.class),
                LocalDate.now(),
                BigDecimal.ONE,
                new BigDecimal(quantity),
                unit,
                "Variedade",
                null,
                null,
                null
        );
    }
}
