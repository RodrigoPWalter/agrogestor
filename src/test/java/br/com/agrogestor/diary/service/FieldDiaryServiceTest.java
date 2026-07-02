package br.com.agrogestor.diary.service;

import br.com.agrogestor.diary.dto.FieldDiaryRequest;
import br.com.agrogestor.diary.dto.FieldDiaryProductRequest;
import br.com.agrogestor.diary.entity.ActivityType;
import br.com.agrogestor.diary.entity.FieldDiaryEntry;
import br.com.agrogestor.diary.entity.FieldDiaryProduct;
import br.com.agrogestor.diary.repository.FieldDiaryRepository;
import br.com.agrogestor.diary.repository.FieldDiaryProductRepository;
import br.com.agrogestor.inventory.entity.InventoryMovement;
import br.com.agrogestor.inventory.entity.InventoryProduct;
import br.com.agrogestor.inventory.entity.MeasurementUnit;
import br.com.agrogestor.inventory.entity.MovementType;
import br.com.agrogestor.inventory.entity.ProductType;
import br.com.agrogestor.inventory.repository.InventoryMovementRepository;
import br.com.agrogestor.inventory.repository.InventoryProductRepository;
import br.com.agrogestor.planting.entity.Planting;
import br.com.agrogestor.planting.repository.PlantingRepository;
import br.com.agrogestor.shared.exception.ResourceNotFoundException;
import br.com.agrogestor.shared.exception.BusinessRuleException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class FieldDiaryServiceTest {

    private FieldDiaryRepository diaryRepository;
    private PlantingRepository plantingRepository;
    private FieldDiaryProductRepository diaryProductRepository;
    private InventoryProductRepository inventoryRepository;
    private InventoryMovementRepository movementRepository;
    private FieldDiaryService service;

    @BeforeEach
    void setUp() {
        diaryRepository = mock(FieldDiaryRepository.class);
        plantingRepository = mock(PlantingRepository.class);
        diaryProductRepository = mock(FieldDiaryProductRepository.class);
        inventoryRepository = mock(InventoryProductRepository.class);
        movementRepository = mock(InventoryMovementRepository.class);
        service = new FieldDiaryService(
                diaryRepository,
                plantingRepository,
                diaryProductRepository,
                inventoryRepository,
                movementRepository
        );
    }

    @Test
    void shouldNormalizeTextWhenCreatingEntry() {
        UUID plantingId = UUID.randomUUID();
        when(plantingRepository.findById(plantingId)).thenReturn(Optional.of(planting()));
        when(diaryRepository.save(any(FieldDiaryEntry.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        service.create(request(plantingId, "  Aplicação   de fungicida  "));

        ArgumentCaptor<FieldDiaryEntry> captor =
                ArgumentCaptor.forClass(FieldDiaryEntry.class);
        verify(diaryRepository).save(captor.capture());
        assertThat(captor.getValue().getActivity()).isEqualTo("Aplicação de fungicida");
    }

    @Test
    void shouldRejectUnknownPlanting() {
        UUID plantingId = UUID.randomUUID();
        when(plantingRepository.findById(plantingId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.create(request(plantingId, "Vistoria")))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Plantio não encontrado");
    }

    @Test
    void shouldDeductAppliedProductFromInventory() {
        UUID plantingId = UUID.randomUUID();
        UUID productId = UUID.randomUUID();
        InventoryProduct product = product(productId, "10.000");
        when(plantingRepository.findById(plantingId)).thenReturn(Optional.of(planting()));
        when(inventoryRepository.findByIdForUpdate(productId))
                .thenReturn(Optional.of(product));
        when(diaryRepository.save(any(FieldDiaryEntry.class))).thenAnswer(invocation -> {
            FieldDiaryEntry entry = invocation.getArgument(0);
            ReflectionTestUtils.setField(entry, "id", UUID.randomUUID());
            return entry;
        });

        service.create(requestWithProduct(plantingId, productId, "3.250"));

        assertThat(product.getQuantity()).isEqualByComparingTo("6.750");
        ArgumentCaptor<InventoryMovement> movement =
                ArgumentCaptor.forClass(InventoryMovement.class);
        verify(movementRepository).save(movement.capture());
        assertThat(movement.getValue().getMovementType()).isEqualTo(MovementType.EXIT);
        assertThat(movement.getValue().getQuantity()).isEqualByComparingTo("3.250");
    }

    @Test
    void shouldRejectApplicationAboveAvailableStock() {
        UUID plantingId = UUID.randomUUID();
        UUID productId = UUID.randomUUID();
        InventoryProduct product = product(productId, "2.000");
        when(plantingRepository.findById(plantingId)).thenReturn(Optional.of(planting()));
        when(inventoryRepository.findByIdForUpdate(productId))
                .thenReturn(Optional.of(product));
        when(diaryRepository.save(any(FieldDiaryEntry.class))).thenAnswer(invocation -> {
            FieldDiaryEntry entry = invocation.getArgument(0);
            ReflectionTestUtils.setField(entry, "id", UUID.randomUUID());
            return entry;
        });

        assertThatThrownBy(() ->
                service.create(requestWithProduct(plantingId, productId, "3.000")))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("estoque disponível");
        assertThat(product.getQuantity()).isEqualByComparingTo("2.000");
    }

    @Test
    void shouldRestoreStockWhenDeletingDiaryEntry() {
        UUID entryId = UUID.randomUUID();
        UUID productId = UUID.randomUUID();
        InventoryProduct product = product(productId, "7.000");
        FieldDiaryEntry entry = new FieldDiaryEntry(
                planting(), LocalDate.now(), ActivityType.APPLICATION,
                "Aplicação de adubo", null, null, null);
        ReflectionTestUtils.setField(entry, "id", entryId);
        when(diaryRepository.findById(entryId)).thenReturn(Optional.of(entry));
        when(diaryProductRepository.findByEntryId(entryId))
                .thenReturn(List.of(new FieldDiaryProduct(
                        entry, product, new BigDecimal("3.000"))));
        when(inventoryRepository.findByIdForUpdate(productId))
                .thenReturn(Optional.of(product));

        service.delete(entryId);

        assertThat(product.getQuantity()).isEqualByComparingTo("10.000");
        ArgumentCaptor<InventoryMovement> movement =
                ArgumentCaptor.forClass(InventoryMovement.class);
        verify(movementRepository).save(movement.capture());
        assertThat(movement.getValue().getMovementType()).isEqualTo(MovementType.ENTRY);
    }

    private FieldDiaryRequest request(UUID plantingId, String activity) {
        return new FieldDiaryRequest(
                plantingId,
                LocalDate.now(),
                ActivityType.APPLICATION,
                activity,
                "Nublado",
                "Fungicida",
                null,
                null
        );
    }

    private FieldDiaryRequest requestWithProduct(
            UUID plantingId,
            UUID productId,
            String quantity
    ) {
        return new FieldDiaryRequest(
                plantingId,
                LocalDate.now(),
                ActivityType.APPLICATION,
                "Aplicação de adubo",
                "Seco",
                null,
                List.of(new FieldDiaryProductRequest(
                        productId, new BigDecimal(quantity))),
                null
        );
    }

    private InventoryProduct product(UUID id, String quantity) {
        InventoryProduct product = new InventoryProduct(
                "Adubo", ProductType.FERTILIZER, new BigDecimal(quantity),
                MeasurementUnit.KILOGRAM, BigDecimal.ONE, null);
        ReflectionTestUtils.setField(product, "id", id);
        return product;
    }

    private Planting planting() {
        return new Planting(
                "Soja",
                "2026/2027",
                new BigDecimal("18.50"),
                LocalDate.of(2026, 7, 1),
                "BRS 284",
                new BigDecimal("900"),
                null
        );
    }
}
