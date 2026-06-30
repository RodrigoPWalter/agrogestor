package br.com.agrogestor.inventory.service;

import br.com.agrogestor.inventory.dto.InventoryProductRequest;
import br.com.agrogestor.inventory.entity.InventoryMovement;
import br.com.agrogestor.inventory.entity.InventoryProduct;
import br.com.agrogestor.inventory.entity.MeasurementUnit;
import br.com.agrogestor.inventory.entity.MovementType;
import br.com.agrogestor.inventory.entity.ProductType;
import br.com.agrogestor.inventory.repository.InventoryMovementRepository;
import br.com.agrogestor.inventory.repository.InventoryProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class InventoryServiceTest {

    private InventoryProductRepository productRepository;
    private InventoryMovementRepository movementRepository;
    private InventoryService service;

    @BeforeEach
    void setUp() {
        productRepository = mock(InventoryProductRepository.class);
        movementRepository = mock(InventoryMovementRepository.class);
        service = new InventoryService(productRepository, movementRepository);
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
}
