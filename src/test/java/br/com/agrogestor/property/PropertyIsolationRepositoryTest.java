package br.com.agrogestor.property;

import br.com.agrogestor.planting.entity.Planting;
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
