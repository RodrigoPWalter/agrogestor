package br.com.agrogestor.production.service;

import br.com.agrogestor.diary.service.ProductionSaleDiarySyncService;
import br.com.agrogestor.planting.entity.Planting;
import br.com.agrogestor.planting.entity.SeedRateUnit;
import br.com.agrogestor.planting.repository.PlantingRepository;
import br.com.agrogestor.production.dto.ProductionSaleRequest;
import br.com.agrogestor.production.entity.ProductionSale;
import br.com.agrogestor.production.repository.ProductionSaleRepository;
import br.com.agrogestor.property.entity.Property;
import br.com.agrogestor.property.service.CurrentPropertyService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductionServiceTest {

    private static final UUID PROPERTY_ID = UUID.randomUUID();
    private static final UUID PLANTING_ID = UUID.randomUUID();

    @Mock
    private ProductionSaleRepository saleRepository;
    @Mock
    private PlantingRepository plantingRepository;
    @Mock
    private ProductionBalanceService balanceService;
    @Mock
    private CurrentPropertyService currentProperty;
    @Mock
    private ProductionSaleDiarySyncService diarySyncService;

    private ProductionService service;
    private Planting planting;

    @BeforeEach
    void setUp() {
        Property property = new Property("Propriedade teste");
        ReflectionTestUtils.setField(property, "id", PROPERTY_ID);
        planting = new Planting(
                property,
                "Soja",
                "2026/2027",
                "Talhão 1",
                new BigDecimal("20"),
                LocalDate.now().minusMonths(4),
                "Zeus",
                new BigDecimal("50"),
                SeedRateUnit.KILOGRAMS_PER_HECTARE,
                null
        );
        ReflectionTestUtils.setField(planting, "id", PLANTING_ID);
        when(currentProperty.id()).thenReturn(PROPERTY_ID);
        service = new ProductionService(
                saleRepository,
                plantingRepository,
                balanceService,
                currentProperty,
                diarySyncService
        );
    }

    @Test
    void shouldCreateSaleAndCalculateTotalAmount() {
        when(plantingRepository.findByIdAndPropertyIdForUpdate(
                PLANTING_ID, PROPERTY_ID)).thenReturn(Optional.of(planting));
        when(saleRepository.save(org.mockito.ArgumentMatchers.any()))
                .thenAnswer(invocation -> invocation.getArgument(0));

        var response = service.createSale(PLANTING_ID, new ProductionSaleRequest(
                LocalDate.now(),
                new BigDecimal("120"),
                new BigDecimal("71.50"),
                "  Cooperativa   local ",
                null
        ));

        verify(balanceService).ensureSaleFitsStock(
                PLANTING_ID, new BigDecimal("120.000"));
        assertThat(response.totalAmount()).isEqualByComparingTo("8580.00");
        assertThat(response.buyer()).isEqualTo("Cooperativa local");

        ArgumentCaptor<ProductionSale> captor =
                ArgumentCaptor.forClass(ProductionSale.class);
        verify(saleRepository).save(captor.capture());
        assertThat(captor.getValue().getProperty().getId()).isEqualTo(PROPERTY_ID);
        verify(diarySyncService).upsert(captor.getValue());
    }
}
