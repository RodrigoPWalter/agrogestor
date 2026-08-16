package br.com.agrogestor.expense.service;

import br.com.agrogestor.expense.dto.ExpenseRequest;
import br.com.agrogestor.expense.entity.Expense;
import br.com.agrogestor.expense.entity.ExpenseCategory;
import br.com.agrogestor.expense.entity.ExpenseOrigin;
import br.com.agrogestor.expense.repository.ExpenseCategoryTotalProjection;
import br.com.agrogestor.expense.repository.ExpenseRepository;
import br.com.agrogestor.expense.repository.PlantingExpenseOverviewProjection;
import br.com.agrogestor.planting.entity.Planting;
import br.com.agrogestor.planting.entity.PlantingStatus;
import br.com.agrogestor.planting.entity.SeedRateUnit;
import br.com.agrogestor.planting.repository.PlantingRepository;
import br.com.agrogestor.shared.exception.ResourceNotFoundException;
import br.com.agrogestor.property.entity.Property;
import br.com.agrogestor.property.service.CurrentPropertyService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ExpenseServiceTest {

    private static final UUID PROPERTY_ID = UUID.randomUUID();
    private final Property property = new Property("Teste");

    @Mock
    private ExpenseRepository expenseRepository;

    @Mock
    private PlantingRepository plantingRepository;
    @Mock
    private CurrentPropertyService currentProperty;

    private ExpenseService service;

    @BeforeEach
    void setUp() {
        service = new ExpenseService(expenseRepository, plantingRepository, currentProperty);
        org.mockito.Mockito.lenient().when(currentProperty.id()).thenReturn(PROPERTY_ID);
        org.mockito.Mockito.lenient().when(currentProperty.get()).thenReturn(property);
    }

    @Test
    void shouldCreateAndNormalizeExpense() {
        UUID plantingId = UUID.randomUUID();
        Planting planting = planting();
        when(plantingRepository.findByIdAndPropertyId(plantingId, PROPERTY_ID)).thenReturn(Optional.of(planting));
        when(expenseRepository.save(any(Expense.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        var response = service.create(request(plantingId, "  Adubo   de base  "));

        ArgumentCaptor<Expense> captor = ArgumentCaptor.forClass(Expense.class);
        verify(expenseRepository).save(captor.capture());
        assertThat(captor.getValue().getDescription()).isEqualTo("Adubo de base");
        assertThat(response.categoryDisplayName()).isEqualTo("Fertilizantes");
        assertThat(response.amount()).isEqualByComparingTo("2500.00");
    }

    @Test
    void shouldRejectExpenseForUnknownPlanting() {
        UUID plantingId = UUID.randomUUID();
        when(plantingRepository.findByIdAndPropertyId(plantingId, PROPERTY_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.create(request(plantingId, "Adubo")))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining(plantingId.toString());
    }

    @Test
    void shouldSummarizeExpensesByCategoryAndHectare() {
        UUID plantingId = UUID.randomUUID();
        Planting planting = planting();
        when(plantingRepository.findByIdAndPropertyId(plantingId, PROPERTY_ID)).thenReturn(Optional.of(planting));
        when(expenseRepository.summarizeByCategory(plantingId)).thenReturn(List.of(
                projection(ExpenseCategory.FERTILIZERS, "6000.00"),
                projection(ExpenseCategory.FUEL, "4000.00")
        ));
        when(expenseRepository.countByPlantingId(plantingId)).thenReturn(2L);

        var summary = service.summarizeByPlanting(plantingId);

        assertThat(summary.totalExpenses()).isEqualByComparingTo("10000.00");
        assertThat(summary.expensePerHectare()).isEqualByComparingTo("100.00");
        assertThat(summary.expenseCount()).isEqualTo(2);
        assertThat(summary.categories()).hasSize(2);
        assertThat(summary.categories().get(0).percentage()).isEqualByComparingTo("60.00");
        assertThat(summary.categories().get(1).percentage()).isEqualByComparingTo("40.00");
    }

    @Test
    void shouldReturnZeroSummaryWhenPlantingHasNoExpenses() {
        UUID plantingId = UUID.randomUUID();
        when(plantingRepository.findByIdAndPropertyId(plantingId, PROPERTY_ID)).thenReturn(Optional.of(planting()));
        when(expenseRepository.summarizeByCategory(plantingId)).thenReturn(List.of());

        var summary = service.summarizeByPlanting(plantingId);

        assertThat(summary.totalExpenses()).isEqualByComparingTo("0.00");
        assertThat(summary.expensePerHectare()).isEqualByComparingTo("0.00");
        assertThat(summary.categories()).isEmpty();
    }

    @Test
    void shouldSummarizePlantingCardsWithOneAggregateQuery() {
        UUID plantingId = UUID.randomUUID();
        when(expenseRepository.summarizePlantingsByStatus(
                PROPERTY_ID, PlantingStatus.ACTIVE
        )).thenReturn(List.of(overviewProjection(
                plantingId, "20.00", "1500.00", 3L
        )));

        var summaries = service.summarizePlantings(PlantingStatus.ACTIVE);

        assertThat(summaries).hasSize(1);
        assertThat(summaries.get(0).plantingId()).isEqualTo(plantingId);
        assertThat(summaries.get(0).totalExpenses())
                .isEqualByComparingTo("1500.00");
        assertThat(summaries.get(0).expensePerHectare())
                .isEqualByComparingTo("75.00");
        assertThat(summaries.get(0).expenseCount()).isEqualTo(3L);
    }

    @Test
    void shouldSummarizeOnlyUnassignedPropertyExpenses() {
        when(expenseRepository.summarizeUnassignedByCategory(
                PROPERTY_ID, ExpenseOrigin.STOCK_ALLOCATION)).thenReturn(List.of(
                projection(ExpenseCategory.MAINTENANCE, "750.00"),
                projection(ExpenseCategory.OTHER, "250.00")
        ));
        when(expenseRepository.countByPropertyIdAndPlantingIsNullAndOriginNot(
                PROPERTY_ID, ExpenseOrigin.STOCK_ALLOCATION)).thenReturn(3L);

        var summary = service.summarizeUnassigned();

        assertThat(summary.totalExpenses()).isEqualByComparingTo("1000.00");
        assertThat(summary.averageExpense()).isEqualByComparingTo("333.33");
        assertThat(summary.expenseCount()).isEqualTo(3);
        assertThat(summary.categories()).hasSize(2);
        assertThat(summary.categories().get(0).percentage())
                .isEqualByComparingTo("75.00");
    }

    private ExpenseRequest request(UUID plantingId, String description) {
        return new ExpenseRequest(
                plantingId,
                description,
                ExpenseCategory.FERTILIZERS,
                new BigDecimal("2500.00"),
                LocalDate.of(2026, 10, 20),
                "Compra à vista"
        );
    }

    private Planting planting() {
        return new Planting(
                property,
                "Soja",
                "2026/2027",
                new BigDecimal("100.00"),
                LocalDate.of(2026, 10, 15),
                "BRS 284",
                new BigDecimal("50.000"),
                SeedRateUnit.KILOGRAMS_PER_HECTARE,
                null
        );
    }

    private ExpenseCategoryTotalProjection projection(
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

    private PlantingExpenseOverviewProjection overviewProjection(
            UUID plantingId,
            String plannedArea,
            String total,
            long count
    ) {
        return new PlantingExpenseOverviewProjection() {
            @Override
            public UUID getPlantingId() {
                return plantingId;
            }

            @Override
            public BigDecimal getPlannedAreaHectares() {
                return new BigDecimal(plannedArea);
            }

            @Override
            public BigDecimal getTotalExpenses() {
                return new BigDecimal(total);
            }

            @Override
            public long getExpenseCount() {
                return count;
            }
        };
    }
}
