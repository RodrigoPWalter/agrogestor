package br.com.agrogestor.inventory.entity;

import br.com.agrogestor.shared.exception.BusinessRuleException;
import br.com.agrogestor.property.entity.Property;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.*;

class InventoryProductTest {

    @Test
    void shouldApplyEntriesAndExits() {
        var product = new InventoryProduct(
                new Property("Teste"),
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
                new Property("Teste"),
                "Defensivo", ProductType.PESTICIDE, BigDecimal.TEN,
                MeasurementUnit.LITER, BigDecimal.ONE, null
        );

        assertThatThrownBy(() ->
                product.applyMovement(MovementType.EXIT, new BigDecimal("10.001")))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("estoque disponível");
    }

    @Test
    void shouldTransferAverageCostWhenProductLeavesInventory() {
        var product = new InventoryProduct(
                new Property("Teste"),
                "Adubo", ProductType.FERTILIZER, BigDecimal.ZERO,
                MeasurementUnit.UNIT, BigDecimal.ONE, null
        );

        product.applyEntry(new BigDecimal("3.000"), new BigDecimal("15000.00"));
        InventoryMovementCost cost = product.applyExit(new BigDecimal("1.000"));

        assertThat(cost.unitCost()).isEqualByComparingTo("5000.000000");
        assertThat(cost.totalCost()).isEqualByComparingTo("5000.00");
        assertThat(product.getQuantity()).isEqualByComparingTo("2.000");
        assertThat(product.getInventoryValue()).isEqualByComparingTo("10000.00");
    }

    @Test
    void shouldUseWeightedAverageForPurchasesAtDifferentPrices() {
        var product = new InventoryProduct(
                new Property("Teste"),
                "Semente", ProductType.SEED, BigDecimal.ZERO,
                MeasurementUnit.KILOGRAM, BigDecimal.ONE, null
        );

        product.applyEntry(new BigDecimal("10.000"), new BigDecimal("1000.00"));
        product.applyEntry(new BigDecimal("10.000"), new BigDecimal("1400.00"));

        assertThat(product.getAverageUnitCost()).isEqualByComparingTo("120.000000");
        assertThat(product.applyExit(new BigDecimal("5.000")).totalCost())
                .isEqualByComparingTo("600.00");
        assertThat(product.getInventoryValue()).isEqualByComparingTo("1800.00");
    }
}
