package br.com.agrogestor.inventory.entity;

import br.com.agrogestor.shared.exception.BusinessRuleException;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.*;

class InventoryProductTest {

    @Test
    void shouldApplyEntriesAndExits() {
        var product = new InventoryProduct(
                "Semente", ProductType.SEED, new BigDecimal("100.000"),
                MeasurementUnit.KILOGRAM, BigDecimal.TEN, null
        );

        product.applyMovement(MovementType.ENTRY, new BigDecimal("20.000"));
        product.applyMovement(MovementType.EXIT, new BigDecimal("35.000"));

        assertThat(product.getQuantity()).isEqualByComparingTo("85.000");
    }

    @Test
    void shouldRejectExitGreaterThanAvailableStock() {
        var product = new InventoryProduct(
                "Defensivo", ProductType.PESTICIDE, BigDecimal.TEN,
                MeasurementUnit.LITER, BigDecimal.ONE, null
        );

        assertThatThrownBy(() ->
                product.applyMovement(MovementType.EXIT, new BigDecimal("10.001")))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("estoque disponível");
    }
}
