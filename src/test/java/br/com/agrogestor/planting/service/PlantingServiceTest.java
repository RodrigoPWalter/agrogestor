package br.com.agrogestor.planting.service;

import br.com.agrogestor.diary.repository.FieldDiaryRepository;
import br.com.agrogestor.diary.entity.ActivityType;
import br.com.agrogestor.diary.entity.FieldDiaryEntry;
import br.com.agrogestor.expense.entity.ExpenseCategory;
import br.com.agrogestor.expense.repository.ExpenseCategoryTotalProjection;
import br.com.agrogestor.expense.repository.ExpenseRepository;
import br.com.agrogestor.planting.dto.PlantingRequest;
import br.com.agrogestor.planting.entity.Planting;
import br.com.agrogestor.planting.entity.HarvestProgressStatus;
import br.com.agrogestor.planting.entity.PlantingProgressStatus;
import br.com.agrogestor.planting.entity.SeedRateUnit;
import br.com.agrogestor.planting.repository.HarvestStepRepository;
import br.com.agrogestor.planting.repository.PlantingRepository;
import br.com.agrogestor.planting.repository.PlantingStepRepository;
import br.com.agrogestor.shared.exception.BusinessRuleException;
import br.com.agrogestor.shared.exception.ResourceNotFoundException;
import br.com.agrogestor.planting.entity.PlantingStatus;
import br.com.agrogestor.property.entity.Property;
import br.com.agrogestor.property.service.CurrentPropertyService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PlantingServiceTest {

    private static final UUID PROPERTY_ID = UUID.randomUUID();
    private final Property property = new Property("Teste");

    @Mock
    private PlantingRepository repository;

    @Mock
    private ExpenseRepository expenseRepository;

    @Mock
    private FieldDiaryRepository diaryRepository;

    @Mock
    private PlantingStepRepository stepRepository;

    @Mock
    private HarvestStepRepository harvestStepRepository;
    @Mock
    private CurrentPropertyService currentProperty;

    private PlantingService service;

    @BeforeEach
    void setUp() {
        lenient().when(stepRepository.sumAreaByPlantingId(any()))
                .thenReturn(BigDecimal.ZERO);
        lenient().when(stepRepository.sumAreasByPlantingIds(any()))
                .thenReturn(List.of());
        lenient().when(harvestStepRepository.sumAreaByPlantingId(any()))
                .thenReturn(BigDecimal.ZERO);
        lenient().when(harvestStepRepository.sumAreasByPlantingIds(any()))
                .thenReturn(List.of());
        lenient().when(harvestStepRepository
                        .findByPlantingIdOrderByHarvestDateAscCreatedAtAsc(any()))
                .thenReturn(List.of());
        lenient().when(currentProperty.id()).thenReturn(PROPERTY_ID);
        lenient().when(currentProperty.get()).thenReturn(property);
        service = new PlantingService(
                repository,
                expenseRepository,
                diaryRepository,
                stepRepository,
                harvestStepRepository,
                currentProperty
        );
    }

    @Test
    void shouldCreateAndNormalizePlanting() {
        PlantingRequest request = request("  Soja   precoce  ", "  Talhão   norte  ");
        when(repository.save(any(Planting.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = service.create(request);

        ArgumentCaptor<Planting> captor = ArgumentCaptor.forClass(Planting.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue().getCrop()).isEqualTo("Soja precoce");
        assertThat(response.crop()).isEqualTo("Soja precoce");
        assertThat(response.observations()).isEqualTo("Talhão norte");
        assertThat(response.seedRate()).isEqualByComparingTo("50.000");
        assertThat(response.seedRateUnit())
                .isEqualTo(SeedRateUnit.KILOGRAMS_PER_HECTARE);
        assertThat(response.seedRateUnitName()).isEqualTo("kg/ha");
        assertThat(response.plantedAreaHectares()).isEqualByComparingTo("0.00");
        assertThat(response.plantingProgressStatus())
                .isEqualTo(PlantingProgressStatus.NOT_STARTED);
        assertThat(response.harvestProgressStatus())
                .isEqualTo(HarvestProgressStatus.NOT_STARTED);
    }

    @Test
    void shouldStoreRowSpacingInCentimeters() {
        PlantingRequest request = new PlantingRequest(
                "Milho",
                "2026",
                "Talhão 1",
                new BigDecimal("12.00"),
                new BigDecimal("70"),
                LocalDate.of(2026, 7, 30),
                "AG 8700",
                new BigDecimal("10.000"),
                SeedRateUnit.SEEDS_PER_HECTARE,
                null
        );
        when(repository.save(any(Planting.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        var response = service.create(request);

        assertThat(response.rowSpacingCentimeters())
                .isEqualByComparingTo("70.00");
    }

    @Test
    void shouldRejectFractionalSeedsPerHectare() {
        PlantingRequest request = new PlantingRequest(
                "Milho",
                "2026",
                new BigDecimal("12.00"),
                LocalDate.of(2026, 7, 30),
                "AG 8700",
                new BigDecimal("60000.500"),
                SeedRateUnit.SEEDS_PER_HECTARE,
                null
        );

        assertThatThrownBy(() -> service.create(request))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessage("A taxa em sementes por hectare deve ser um número inteiro");
        verify(repository, never()).save(any());
    }

    @Test
    void shouldFilterListByHarvest() {
        Planting planting = planting();
        when(repository.findByPropertyIdAndHarvestIgnoreCase(any(), any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(planting)));

        var result = service.findAll(" 2026/2027 ", 0, 20);

        assertThat(result.content()).hasSize(1);
        assertThat(result.content().getFirst().harvest()).isEqualTo("2026/2027");
        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(repository).findByPropertyIdAndHarvestIgnoreCase(
                org.mockito.ArgumentMatchers.eq(PROPERTY_ID),
                org.mockito.ArgumentMatchers.eq("2026/2027"),
                pageableCaptor.capture()
        );
        assertThat(pageableCaptor.getValue().getPageNumber()).isZero();
        assertThat(pageableCaptor.getValue().getPageSize()).isEqualTo(20);
        verify(repository, never()).findByPropertyId(any(), any(Pageable.class));
    }

    @Test
    void shouldThrowClearErrorWhenPlantingDoesNotExist() {
        UUID id = UUID.randomUUID();
        when(repository.findByIdAndPropertyId(id, PROPERTY_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.findById(id))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining(id.toString());
    }

    @Test
    void shouldUpdateExistingPlanting() {
        UUID id = UUID.randomUUID();
        Planting planting = planting();
        when(repository.findByIdAndPropertyIdForUpdate(id, PROPERTY_ID))
                .thenReturn(Optional.of(planting));

        var response = service.update(id, request("Milho", null));

        assertThat(response.crop()).isEqualTo("Milho");
        assertThat(response.observations()).isNull();
    }

    @Test
    void shouldRejectPlannedAreaBelowAlreadyPlantedArea() {
        UUID id = UUID.randomUUID();
        when(repository.findByIdAndPropertyIdForUpdate(id, PROPERTY_ID))
                .thenReturn(Optional.of(planting()));
        when(stepRepository.sumAreaByPlantingId(id))
                .thenReturn(new BigDecimal("20.00"));

        PlantingRequest request = new PlantingRequest(
                "Milho",
                "2026/2027",
                new BigDecimal("18.50"),
                LocalDate.of(2026, 10, 15),
                "BRS 284",
                new BigDecimal("50.000"),
                SeedRateUnit.KILOGRAMS_PER_HECTARE,
                null
        );

        assertThatThrownBy(() -> service.update(id, request))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("20 hectares já plantados");
    }

    @Test
    void shouldMarkProgressAsCompletedWhenPlantedAreaReachesPlan() {
        UUID id = UUID.randomUUID();
        when(repository.findByIdAndPropertyId(id, PROPERTY_ID)).thenReturn(Optional.of(planting()));
        when(stepRepository.sumAreaByPlantingId(id))
                .thenReturn(new BigDecimal("18.50"));

        var response = service.findById(id);

        assertThat(response.plantedPercentage()).isEqualByComparingTo("100.00");
        assertThat(response.remainingAreaHectares()).isEqualByComparingTo("0.00");
        assertThat(response.plantingProgressStatus())
                .isEqualTo(PlantingProgressStatus.COMPLETED);
    }

    @Test
    void shouldDeleteOnlyExistingPlanting() {
        UUID id = UUID.randomUUID();
        Planting planting = planting();
        when(repository.findByIdAndPropertyId(id, PROPERTY_ID)).thenReturn(Optional.of(planting));

        service.delete(id);

        verify(repository).delete(planting);
    }

    @Test
    void shouldReactivateFinishedPlanting() {
        UUID id = UUID.randomUUID();
        Planting planting = planting();
        planting.finish();
        when(repository.findByIdAndPropertyId(id, PROPERTY_ID)).thenReturn(Optional.of(planting));

        var response = service.reactivate(id);

        assertThat(response.status()).isEqualTo(PlantingStatus.ACTIVE);
        assertThat(response.completedAt()).isNull();
    }

    @Test
    void shouldRejectFinishingBeforeAllPlantedAreaIsHarvested() {
        UUID id = UUID.randomUUID();
        when(repository.findByIdAndPropertyIdForUpdate(id, PROPERTY_ID)).thenReturn(Optional.of(planting()));
        when(stepRepository.sumAreaByPlantingId(id))
                .thenReturn(new BigDecimal("18.50"));
        when(harvestStepRepository.sumAreaByPlantingId(id))
                .thenReturn(new BigDecimal("10.00"));

        assertThatThrownBy(() -> service.finish(id))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("8,5 hectares para colher");
    }

    @Test
    void shouldFinishAfterAllPlantedAreaIsHarvested() {
        UUID id = UUID.randomUUID();
        when(repository.findByIdAndPropertyIdForUpdate(id, PROPERTY_ID)).thenReturn(Optional.of(planting()));
        when(stepRepository.sumAreaByPlantingId(id))
                .thenReturn(new BigDecimal("18.50"));
        when(harvestStepRepository.sumAreaByPlantingId(id))
                .thenReturn(new BigDecimal("18.50"));

        var response = service.finish(id);

        assertThat(response.status()).isEqualTo(PlantingStatus.HARVESTED);
        assertThat(response.harvestProgressStatus())
                .isEqualTo(HarvestProgressStatus.COMPLETED);
    }

    @Test
    void shouldBuildSeasonClosingWithRevenueEstimate() {
        UUID id = UUID.randomUUID();
        when(repository.findByIdAndPropertyId(id, PROPERTY_ID)).thenReturn(Optional.of(planting()));
        when(expenseRepository.summarizeByCategory(id)).thenReturn(List.of(
                expenseProjection(ExpenseCategory.SEEDS, "3000.00"),
                expenseProjection(ExpenseCategory.FUEL, "2000.00")
        ));
        when(expenseRepository.countByPlantingId(id)).thenReturn(2L);
        when(diaryRepository.findByPlantingIdAndActivityType(id, ActivityType.HARVEST))
                .thenReturn(List.of(
                        harvestEntry("Caixas", "999.000"),
                        harvestEntry("Sacas", "120.000")
                ));

        var closing = service.seasonClosing(id, new BigDecimal("70.00"));

        assertThat(closing.totalExpenses()).isEqualByComparingTo("5000.00");
        assertThat(closing.expensePerHectare()).isEqualByComparingTo("270.27");
        assertThat(closing.mainHarvestQuantity()).isEqualByComparingTo("120.000");
        assertThat(closing.mainHarvestUnit()).isEqualTo("sacas de 60 kg");
        assertThat(closing.estimatedRevenue()).isEqualByComparingTo("8400.00");
        assertThat(closing.estimatedResult()).isEqualByComparingTo("3400.00");
        assertThat(closing.expensesByCategory()).hasSize(2);
    }

    @Test
    void shouldPersistSalePriceAndReuseItWhenReopeningSeasonClosing() {
        UUID id = UUID.randomUUID();
        Planting planting = planting();
        when(repository.findByIdAndPropertyIdForUpdate(id, PROPERTY_ID))
                .thenReturn(Optional.of(planting));
        when(repository.findByIdAndPropertyId(id, PROPERTY_ID))
                .thenReturn(Optional.of(planting));
        when(expenseRepository.summarizeByCategory(id)).thenReturn(List.of());

        var saved = service.updateSeasonClosingPrice(
                id,
                new BigDecimal("72.50")
        );
        var reopened = service.seasonClosing(id, null);

        assertThat(planting.getSalePricePer60KgBag())
                .isEqualByComparingTo("72.50");
        assertThat(saved.salePricePerUnit()).isEqualByComparingTo("72.50");
        assertThat(reopened.salePricePerUnit()).isEqualByComparingTo("72.50");
    }

    @Test
    void shouldRejectNonPositiveSalePrice() {
        UUID id = UUID.randomUUID();
        when(repository.findByIdAndPropertyIdForUpdate(id, PROPERTY_ID))
                .thenReturn(Optional.of(planting()));

        assertThatThrownBy(() -> service.updateSeasonClosingPrice(
                id,
                BigDecimal.ZERO
        ))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("maior que zero");
    }

    private PlantingRequest request(String crop, String observations) {
        return new PlantingRequest(
                crop,
                "2026/2027",
                new BigDecimal("18.50"),
                LocalDate.of(2026, 10, 15),
                "BRS 284",
                new BigDecimal("50.000"),
                SeedRateUnit.KILOGRAMS_PER_HECTARE,
                observations
        );
    }

    private Planting planting() {
        return new Planting(
                property,
                "Soja",
                "2026/2027",
                new BigDecimal("18.50"),
                LocalDate.of(2026, 10, 15),
                "BRS 284",
                new BigDecimal("50.000"),
                SeedRateUnit.KILOGRAMS_PER_HECTARE,
                "Talhão norte"
        );
    }

    private ExpenseCategoryTotalProjection expenseProjection(
            ExpenseCategory category,
            String total
    ) {
        return new ExpenseCategoryTotalProjection() {
            @Override
            public ExpenseCategory getCategory() {
                return category;
            }

            @Override
            public BigDecimal getTotal() {
                return new BigDecimal(total);
            }
        };
    }

    private FieldDiaryEntry harvestEntry(String unit, String quantity) {
        FieldDiaryEntry entry = new FieldDiaryEntry(
                property,
                planting(),
                LocalDate.of(2026, 2, 10),
                ActivityType.HARVEST,
                "Colheita",
                null,
                null,
                null
        );
        entry.updateDetails(null, null, null, null, new BigDecimal(quantity), unit);
        return entry;
    }
}
