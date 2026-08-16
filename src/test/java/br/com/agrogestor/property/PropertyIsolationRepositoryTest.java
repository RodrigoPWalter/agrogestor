package br.com.agrogestor.property;

import br.com.agrogestor.expense.entity.Expense;
import br.com.agrogestor.expense.entity.ExpenseCategory;
import br.com.agrogestor.expense.repository.ExpenseRepository;
import br.com.agrogestor.planting.entity.Planting;
import br.com.agrogestor.planting.entity.PlantingStatus;
import br.com.agrogestor.planting.entity.SeedRateUnit;
import br.com.agrogestor.planting.repository.PlantingRepository;
import br.com.agrogestor.property.entity.Property;
import br.com.agrogestor.property.repository.PropertyRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest(properties = {
        "spring.flyway.enabled=false",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
class PropertyIsolationRepositoryTest {

    @Autowired
    private PropertyRepository propertyRepository;

    @Autowired
    private PlantingRepository plantingRepository;

    @Autowired
    private ExpenseRepository expenseRepository;

    @Test
    void onlyReturnsPlantingsFromTheRequestedProperty() {
        Property first = propertyRepository.save(new Property("Propriedade principal"));
        Property second = propertyRepository.save(new Property("Propriedade de testes"));
        Planting principalPlanting = plantingRepository.save(planting(first, "Soja"));
        Planting testPlanting = plantingRepository.save(planting(second, "Milho"));

        var firstResult = plantingRepository.findByPropertyId(
                first.getId(), PageRequest.of(0, 20));

        assertThat(firstResult.getContent())
                .extracting(Planting::getCrop)
                .containsExactly("Soja");
        assertThat(plantingRepository.findByIdAndPropertyId(
                testPlanting.getId(), first.getId())).isEmpty();
        assertThat(plantingRepository.findByIdAndPropertyId(
                principalPlanting.getId(), first.getId())).isPresent();
    }

    @Test
    void summarizesOnlyActivePlantingsFromTheRequestedProperty() {
        Property first = propertyRepository.save(new Property("Propriedade principal"));
        Property second = propertyRepository.save(new Property("Propriedade de testes"));
        Planting active = plantingRepository.save(planting(first, "Soja"));
        Planting harvested = planting(first, "Trigo");
        harvested.finish();
        plantingRepository.save(harvested);
        Planting otherProperty = plantingRepository.save(planting(second, "Milho"));

        expenseRepository.save(expense(first, active, "Sementes", "1200.00"));
        expenseRepository.save(expense(first, active, "Adubo", "800.00"));
        expenseRepository.save(expense(first, harvested, "Colheita", "500.00"));
        expenseRepository.save(expense(second, otherProperty, "Sementes", "900.00"));

        var summaries = expenseRepository.summarizePlantingsByStatus(
                first.getId(), PlantingStatus.ACTIVE);

        assertThat(summaries).singleElement().satisfies(summary -> {
            assertThat(summary.getPlantingId()).isEqualTo(active.getId());
            assertThat(summary.getPlannedAreaHectares()).isEqualByComparingTo("10.00");
            assertThat(summary.getTotalExpenses()).isEqualByComparingTo("2000.00");
            assertThat(summary.getExpenseCount()).isEqualTo(2);
        });
    }

    private Expense expense(
            Property property,
            Planting planting,
            String description,
            String amount
    ) {
        return new Expense(
                property,
                planting,
                description,
                ExpenseCategory.OTHER,
                new BigDecimal(amount),
                LocalDate.of(2026, 8, 1),
                null
        );
    }

    private Planting planting(Property property, String crop) {
        return new Planting(
                property,
                crop,
                "2026/2027",
                new BigDecimal("10.00"),
                LocalDate.of(2026, 8, 1),
                "Variedade teste",
                new BigDecimal("50.000"),
                SeedRateUnit.KILOGRAMS_PER_HECTARE,
                null
        );
    }
}
