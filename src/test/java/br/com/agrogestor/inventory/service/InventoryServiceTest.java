package br.com.agrogestor.inventory.service;

import br.com.agrogestor.inventory.dto.InventoryProductRequest;
import br.com.agrogestor.inventory.dto.InventoryMovementRequest;
import br.com.agrogestor.inventory.dto.InventoryProductUpdateRequest;
import br.com.agrogestor.inventory.entity.InventoryMovement;
import br.com.agrogestor.inventory.entity.InventoryProduct;
import br.com.agrogestor.inventory.entity.MeasurementUnit;
import br.com.agrogestor.inventory.entity.MovementType;
import br.com.agrogestor.inventory.entity.ProductType;
import br.com.agrogestor.inventory.repository.InventoryMovementRepository;
import br.com.agrogestor.inventory.repository.InventoryProductRepository;
import br.com.agrogestor.property.entity.Property;
import br.com.agrogestor.property.service.CurrentPropertyService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class InventoryServiceTest {

    private static final UUID PROPERTY_ID = UUID.fromString(
            "1d85a7b2-80d6-4967-a16a-b11e7df62481"
    );

    private InventoryProductRepository productRepository;
    private InventoryMovementRepository movementRepository;
    private InventoryService service;
    private CurrentPropertyService currentProperty;

    @BeforeEach
    void setUp() {
        productRepository = mock(InventoryProductRepository.class);
        movementRepository = mock(InventoryMovementRepository.class);
        currentProperty = mock(CurrentPropertyService.class);
        when(currentProperty.get()).thenReturn(new Property("Teste"));
        when(currentProperty.id()).thenReturn(PROPERTY_ID);
        service = new InventoryService(productRepository, movementRepository, currentProperty);
    }

    @Test
    void shouldKeepInitialBalanceInMovementHistory() {
        when(productRepository.save(any(InventoryProduct.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        service.create(new InventoryProductRequest(
                "Adubo NPK",
                ProductType.FERTILIZER,
                new BigDecimal("120.000"),
                MeasurementUnit.KILOGRAM,
                new BigDecimal("20.000"),
                null
        ));

        ArgumentCaptor<InventoryMovement> captor =
                ArgumentCaptor.forClass(InventoryMovement.class);
        verify(movementRepository).save(captor.capture());

        assertThat(captor.getValue().getMovementType()).isEqualTo(MovementType.ENTRY);
        assertThat(captor.getValue().getQuantity()).isEqualByComparingTo("120.000");
        assertThat(captor.getValue().getNotes()).isEqualTo("Saldo inicial");
    }

    @Test
    void shouldLockProductWhileChangingStock() {
        UUID productId = UUID.randomUUID();
        InventoryProduct product = product();
        when(productRepository.findByIdAndPropertyIdForUpdate(productId, PROPERTY_ID))
                .thenReturn(Optional.of(product));

        service.move(productId, new InventoryMovementRequest(
                MovementType.EXIT,
                new BigDecimal("2.000"),
                LocalDate.of(2026, 8, 11),
                "Uso no campo"
        ));

        verify(productRepository).findByIdAndPropertyIdForUpdate(productId, PROPERTY_ID);
        assertThat(product.getQuantity()).isEqualByComparingTo("8.000");
    }

    @Test
    void shouldLockProductWhileEditingItsDetails() {
        UUID productId = UUID.randomUUID();
        InventoryProduct product = product();
        when(productRepository.findByIdAndPropertyIdForUpdate(productId, PROPERTY_ID))
                .thenReturn(Optional.of(product));

        service.update(productId, new InventoryProductUpdateRequest(
                "Adubo atualizado",
                ProductType.FERTILIZER,
                MeasurementUnit.KILOGRAM,
                new BigDecimal("2.000"),
                null
        ));

        verify(productRepository).findByIdAndPropertyIdForUpdate(productId, PROPERTY_ID);
        assertThat(product.getName()).isEqualTo("Adubo atualizado");
    }

    private InventoryProduct product() {
        return new InventoryProduct(
                new Property("Teste"),
                "Adubo NPK",
                ProductType.FERTILIZER,
                new BigDecimal("10.000"),
                MeasurementUnit.KILOGRAM,
                BigDecimal.ZERO,
                null
        );
    }
}
