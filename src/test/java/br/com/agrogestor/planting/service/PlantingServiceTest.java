package br.com.agrogestor.planting.service;

import br.com.agrogestor.diary.repository.FieldDiaryRepository;
import br.com.agrogestor.diary.entity.ActivityType;
import br.com.agrogestor.diary.entity.FieldDiaryEntry;
import br.com.agrogestor.expense.entity.ExpenseCategory;
import br.com.agrogestor.expense.repository.ExpenseCategoryTotalProjection;
import br.com.agrogestor.expense.repository.ExpenseRepository;
import br.com.agrogestor.planting.dto.PlantingRequest;
import br.com.agrogestor.planting.entity.Planting;
import br.com.agrogestor.planting.repository.PlantingRepository;
import br.com.agrogestor.shared.exception.ResourceNotFoundException;
import br.com.agrogestor.planting.entity.PlantingStatus;
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
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PlantingServiceTest {

    @Mock
    private PlantingRepository repository;

    @Mock
    private ExpenseRepository expenseRepository;

    @Mock
    private FieldDiaryRepository diaryRepository;

    private PlantingService service;

    @BeforeEach
    void setUp() {
        service = new PlantingService(repository, expenseRepository, diaryRepository);
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
    }

    @Test
    void shouldFilterListByHarvest() {
        Planting planting = planting();
        when(repository.findByHarvestIgnoreCase(any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(planting)));

        var result = service.findAll(" 2026/2027 ", 0, 20);

        assertThat(result.content()).hasSize(1);
        assertThat(result.content().getFirst().harvest()).isEqualTo("2026/2027");
        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(repository).findByHarvestIgnoreCase(
                org.mockito.ArgumentMatchers.eq("2026/2027"),
                pageableCaptor.capture()
        );
        assertThat(pageableCaptor.getValue().getPageNumber()).isZero();
        assertThat(pageableCaptor.getValue().getPageSize()).isEqualTo(20);
        verify(repository, never()).findAll(any(Pageable.class));
    }

    @Test
    void shouldThrowClearErrorWhenPlantingDoesNotExist() {
        UUID id = UUID.randomUUID();
        when(repository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.findById(id))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining(id.toString());
    }

    @Test
    void shouldUpdateExistingPlanting() {
        UUID id = UUID.randomUUID();
        Planting planting = planting();
        when(repository.findById(id)).thenReturn(Optional.of(planting));

        var response = service.update(id, request("Milho", null));

        assertThat(response.crop()).isEqualTo("Milho");
        assertThat(response.observations()).isNull();
    }

    @Test
    void shouldDeleteOnlyExistingPlanting() {
        UUID id = UUID.randomUUID();
        Planting planting = planting();
        when(repository.findById(id)).thenReturn(Optional.of(planting));

        service.delete(id);

        verify(repository).delete(planting);
    }

    @Test
    void shouldReactivateFinishedPlanting() {
        UUID id = UUID.randomUUID();
        Planting planting = planting();
        planting.finish();
        when(repository.findById(id)).thenReturn(Optional.of(planting));

        var response = service.reactivate(id);

        assertThat(response.status()).isEqualTo(PlantingStatus.ACTIVE);
        assertThat(response.completedAt()).isNull();
    }

    @Test
    void shouldBuildSeasonClosingWithRevenueEstimate() {
        UUID id = UUID.randomUUID();
        when(repository.findById(id)).thenReturn(Optional.of(planting()));
        when(expenseRepository.summarizeByCategory(id)).thenReturn(List.of(
                expenseProjection(ExpenseCategory.SEEDS, "3000.00"),
                expenseProjection(ExpenseCategory.FUEL, "2000.00")
        ));
        when(expenseRepository.countByPlantingId(id)).thenReturn(2L);
        when(diaryRepository.findByPlantingIdAndActivityType(id, ActivityType.HARVEST))
                .thenReturn(List.of(harvestEntry("Sacas", "120.000")));

        var closing = service.seasonClosing(id, new BigDecimal("70.00"));

        assertThat(closing.totalExpenses()).isEqualByComparingTo("5000.00");
        assertThat(closing.expensePerHectare()).isEqualByComparingTo("270.27");
        assertThat(closing.mainHarvestQuantity()).isEqualByComparingTo("120.000");
        assertThat(closing.estimatedRevenue()).isEqualByComparingTo("8400.00");
        assertThat(closing.estimatedResult()).isEqualByComparingTo("3400.00");
        assertThat(closing.expensesByCategory()).hasSize(2);
    }

    private PlantingRequest request(String crop, String observations) {
        return new PlantingRequest(
                crop,
                "2026/2027",
                new BigDecimal("18.50"),
                LocalDate.of(2026, 10, 15),
                "BRS 284",
                new BigDecimal("925.000"),
                observations
        );
    }

    private Planting planting() {
        return new Planting(
                "Soja",
                "2026/2027",
                new BigDecimal("18.50"),
                LocalDate.of(2026, 10, 15),
                "BRS 284",
                new BigDecimal("925.000"),
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
