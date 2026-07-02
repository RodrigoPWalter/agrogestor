package br.com.agrogestor.diary.service;

import br.com.agrogestor.diary.dto.FieldDiaryRequest;
import br.com.agrogestor.diary.entity.ActivityType;
import br.com.agrogestor.diary.entity.FieldDiaryEntry;
import br.com.agrogestor.diary.repository.FieldDiaryRepository;
import br.com.agrogestor.diary.repository.FieldDiaryProductRepository;
import br.com.agrogestor.inventory.repository.InventoryProductRepository;
import br.com.agrogestor.planting.entity.Planting;
import br.com.agrogestor.planting.repository.PlantingRepository;
import br.com.agrogestor.shared.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.math.BigDecimal;
import java.time.LocalDate;
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
    private FieldDiaryService service;

    @BeforeEach
    void setUp() {
        diaryRepository = mock(FieldDiaryRepository.class);
        plantingRepository = mock(PlantingRepository.class);
        service = new FieldDiaryService(
                diaryRepository,
                plantingRepository,
                mock(FieldDiaryProductRepository.class),
                mock(InventoryProductRepository.class)
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
