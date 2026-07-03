package br.com.agrogestor.expense.service;

import br.com.agrogestor.expense.dto.ExpenseRequest;
import br.com.agrogestor.expense.entity.Expense;
import br.com.agrogestor.expense.entity.ExpenseCategory;
import br.com.agrogestor.expense.repository.ExpenseCategoryTotalProjection;
import br.com.agrogestor.expense.repository.ExpenseRepository;
import br.com.agrogestor.planting.entity.Planting;
import br.com.agrogestor.planting.repository.PlantingRepository;
import br.com.agrogestor.shared.exception.ResourceNotFoundException;
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

    @Mock
    private ExpenseRepository expenseRepository;

    @Mock
    private PlantingRepository plantingRepository;

    private ExpenseService service;

    @BeforeEach
    void setUp() {
        service = new ExpenseService(expenseRepository, plantingRepository);
    }

    @Test
    void shouldCreateAndNormalizeExpense() {
        UUID plantingId = UUID.randomUUID();
        Planting planting = planting();
        when(plantingRepository.findById(plantingId)).thenReturn(Optional.of(planting));
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
        when(plantingRepository.findById(plantingId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.create(request(plantingId, "Adubo")))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining(plantingId.toString());
    }

    @Test
    void shouldSummarizeExpensesByCategoryAndHectare() {
        UUID plantingId = UUID.randomUUID();
        Planting planting = planting();
        when(plantingRepository.findById(plantingId)).thenReturn(Optional.of(planting));
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
        when(plantingRepository.findById(plantingId)).thenReturn(Optional.of(planting()));
        when(expenseRepository.summarizeByCategory(plantingId)).thenReturn(List.of());

        var summary = service.summarizeByPlanting(plantingId);

        assertThat(summary.totalExpenses()).isEqualByComparingTo("0.00");
        assertThat(summary.expensePerHectare()).isEqualByComparingTo("0.00");
        assertThat(summary.categories()).isEmpty();
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
                "Soja",
                "2026/2027",
                new BigDecimal("100.00"),
                LocalDate.of(2026, 10, 15),
                "BRS 284",
                new BigDecimal("5000.000"),
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
}
