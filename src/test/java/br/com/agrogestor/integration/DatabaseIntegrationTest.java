package br.com.agrogestor.integration;

import br.com.agrogestor.dashboard.service.DashboardService;
import br.com.agrogestor.diary.dto.FieldDiaryProductRequest;
import br.com.agrogestor.diary.dto.FieldDiaryRequest;
import br.com.agrogestor.diary.entity.ActivityType;
import br.com.agrogestor.diary.repository.FieldDiaryRepository;
import br.com.agrogestor.diary.service.FieldDiaryService;
import br.com.agrogestor.inventory.dto.InventoryProductRequest;
import br.com.agrogestor.inventory.entity.MeasurementUnit;
import br.com.agrogestor.inventory.entity.ProductType;
import br.com.agrogestor.inventory.service.InventoryService;
import br.com.agrogestor.shared.exception.BusinessRuleException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest(properties = "agrogestor.security.bootstrap-admin.enabled=false")
@EnabledIfEnvironmentVariable(named = "RUN_DATABASE_TESTS", matches = "true")
class DatabaseIntegrationTest {

    @Autowired
    private InventoryService inventoryService;

    @Autowired
    private FieldDiaryService diaryService;

    @Autowired
    private FieldDiaryRepository diaryRepository;

    @Autowired
    private DashboardService dashboardService;

    @Test
    void shouldApplyAndReverseAProductUseInTheSameDatabase() {
        var product = inventoryService.create(productRequest("Herbicida integração"));
        var entry = diaryService.create(productUseRequest(
                product.id(),
                new BigDecimal("3.000")
        ));

        assertThat(inventoryService.findById(product.id()).quantity())
                .isEqualByComparingTo("7.000");

        diaryService.delete(entry.id());

        assertThat(inventoryService.findById(product.id()).quantity())
                .isEqualByComparingTo("10.000");
        inventoryService.delete(product.id());
    }

    @Test
    void shouldRollbackTheDiaryEntryWhenStockIsInsufficient() {
        var product = inventoryService.create(productRequest("Fertilizante integração"));
        long entriesBefore = diaryRepository.count();

        assertThatThrownBy(() -> diaryService.create(productUseRequest(
                product.id(),
                new BigDecimal("11.000")
        ))).isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("estoque disponível");

        assertThat(inventoryService.findById(product.id()).quantity())
                .isEqualByComparingTo("10.000");
        assertThat(diaryRepository.count()).isEqualTo(entriesBefore);
        inventoryService.delete(product.id());
    }

    @Test
    void shouldRunTheDashboardQueriesAfterAllMigrations() {
        var summary = dashboardService.summarize();

        assertThat(summary.metrics()).isNotNull();
        assertThat(summary.recentPlantings()).hasSizeLessThanOrEqualTo(5);
        assertThat(summary.recentExpenses()).hasSizeLessThanOrEqualTo(5);
        assertThat(summary.inventoryProducts()).hasSizeLessThanOrEqualTo(5);
    }

    private InventoryProductRequest productRequest(String name) {
        return new InventoryProductRequest(
                name,
                ProductType.PESTICIDE,
                new BigDecimal("10.000"),
                MeasurementUnit.LITER,
                new BigDecimal("1.000"),
                null
        );
    }

    private FieldDiaryRequest productUseRequest(
            java.util.UUID productId,
            BigDecimal quantity
    ) {
        return new FieldDiaryRequest(
                null,
                LocalDate.now(),
                ActivityType.PRODUCT_USE,
                "Aplicação de teste",
                null,
                null,
                List.of(new FieldDiaryProductRequest(productId, quantity)),
                null
        );
    }
}
