package br.com.agrogestor.planting.service;

import br.com.agrogestor.diary.entity.ActivityType;
import br.com.agrogestor.diary.entity.FieldDiaryEntry;
import br.com.agrogestor.diary.repository.FieldDiaryRepository;
import br.com.agrogestor.planting.dto.PlantingStepRequest;
import br.com.agrogestor.planting.entity.Planting;
import br.com.agrogestor.planting.entity.SeedRateUnit;
import br.com.agrogestor.planting.entity.PlantingStep;
import br.com.agrogestor.planting.repository.PlantingRepository;
import br.com.agrogestor.planting.repository.PlantingStepRepository;
import br.com.agrogestor.shared.exception.BusinessRuleException;
import br.com.agrogestor.shared.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PlantingStepServiceTest {

    @Mock
    private PlantingStepRepository stepRepository;

    @Mock
    private PlantingRepository plantingRepository;

    @Mock
    private FieldDiaryRepository diaryRepository;

    private PlantingStepService service;

    @BeforeEach
    void setUp() {
        service = new PlantingStepService(
                stepRepository,
                plantingRepository,
                diaryRepository
        );
    }

    @Test
    void shouldAddStepAndCreateDiaryEntry() {
        UUID plantingId = UUID.randomUUID();
        Planting planting = planting("30.00");
        when(plantingRepository.findByIdForUpdate(plantingId))
                .thenReturn(Optional.of(planting));
        when(stepRepository.sumAreaByPlantingId(plantingId))
                .thenReturn(BigDecimal.ZERO);
        when(stepRepository.save(any(PlantingStep.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(diaryRepository.save(any(FieldDiaryEntry.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        var response = service.create(plantingId, request("5.00"));

        assertThat(response.plantedAreaHectares()).isEqualByComparingTo("5.00");
        assertThat(response.seedVariety()).isEqualTo("BRS 284");
        ArgumentCaptor<FieldDiaryEntry> diaryCaptor =
                ArgumentCaptor.forClass(FieldDiaryEntry.class);
        verify(diaryRepository).save(diaryCaptor.capture());
        assertThat(diaryCaptor.getValue().getActivityType())
                .isEqualTo(ActivityType.PLANTING);
        assertThat(diaryCaptor.getValue().getActivity())
                .contains("5 hectares")
                .contains("Talhão 2")
                .contains("variedade BRS 284");
    }

    @Test
    void shouldUsePlannedVarietyForRequestFromPreviousFrontendVersion() {
        UUID plantingId = UUID.randomUUID();
        Planting planting = planting("30.00");
        PlantingStepRequest legacyRequest = new PlantingStepRequest(
                LocalDate.of(2026, 7, 2),
                new BigDecimal("5.00"),
                null,
                null,
                null,
                null
        );
        when(plantingRepository.findByIdForUpdate(plantingId))
                .thenReturn(Optional.of(planting));
        when(stepRepository.sumAreaByPlantingId(plantingId))
                .thenReturn(BigDecimal.ZERO);
        when(stepRepository.save(any(PlantingStep.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(diaryRepository.save(any(FieldDiaryEntry.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        var response = service.create(plantingId, legacyRequest);

        assertThat(response.seedVariety()).isEqualTo("BRS 284");
    }

    @Test
    void shouldRejectAreaGreaterThanRemainingArea() {
        UUID plantingId = UUID.randomUUID();
        when(plantingRepository.findByIdForUpdate(plantingId))
                .thenReturn(Optional.of(planting("30.00")));
        when(stepRepository.sumAreaByPlantingId(plantingId))
                .thenReturn(new BigDecimal("25.00"));

        assertThatThrownBy(() -> service.create(plantingId, request("10.00")))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("restam apenas 5 hectares");
        verify(stepRepository, never()).save(any());
        verify(diaryRepository, never()).save(any());
    }

    @Test
    void shouldRejectStepBeforePlantingStartDate() {
        UUID plantingId = UUID.randomUUID();
        when(plantingRepository.findByIdForUpdate(plantingId))
                .thenReturn(Optional.of(planting("30.00")));

        PlantingStepRequest request = new PlantingStepRequest(
                LocalDate.of(2026, 6, 30),
                new BigDecimal("5.00"),
                "BRS 284",
                null,
                null,
                null
        );

        assertThatThrownBy(() -> service.create(plantingId, request))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("anterior ao início");
    }

    @Test
    void shouldRejectStepForFinishedPlanting() {
        UUID plantingId = UUID.randomUUID();
        Planting planting = planting("30.00");
        planting.finish();
        when(plantingRepository.findByIdForUpdate(plantingId))
                .thenReturn(Optional.of(planting));

        assertThatThrownBy(() -> service.create(plantingId, request("5.00")))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("plantio finalizado");
    }

    @Test
    void shouldRejectStepDeletionForFinishedPlanting() {
        UUID plantingId = UUID.randomUUID();
        UUID stepId = UUID.randomUUID();
        Planting planting = planting("30.00");
        planting.finish();
        when(plantingRepository.findByIdForUpdate(plantingId))
                .thenReturn(Optional.of(planting));

        assertThatThrownBy(() -> service.delete(plantingId, stepId))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("plantio finalizado");
        verify(stepRepository, never()).delete(any());
    }

    @Test
    void shouldRejectInvalidTimeRange() {
        UUID plantingId = UUID.randomUUID();
        when(plantingRepository.findByIdForUpdate(plantingId))
                .thenReturn(Optional.of(planting("30.00")));

        PlantingStepRequest request = new PlantingStepRequest(
                LocalDate.of(2026, 7, 2),
                new BigDecimal("5.00"),
                "BRS 284",
                LocalTime.of(18, 0),
                LocalTime.of(8, 0),
                null
        );

        assertThatThrownBy(() -> service.create(plantingId, request))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("horário de término");
    }

    @Test
    void shouldRecalculateAvailableAreaWhenEditingStep() {
        UUID plantingId = UUID.randomUUID();
        UUID stepId = UUID.randomUUID();
        Planting planting = planting("30.00");
        PlantingStep step = new PlantingStep(
                planting,
                LocalDate.of(2026, 7, 2),
                new BigDecimal("10.00"),
                "BRS 284",
                null,
                null,
                null
        );
        when(plantingRepository.findByIdForUpdate(plantingId))
                .thenReturn(Optional.of(planting));
        when(stepRepository.findByIdAndPlantingId(stepId, plantingId))
                .thenReturn(Optional.of(step));
        when(stepRepository.sumAreaByPlantingId(plantingId))
                .thenReturn(new BigDecimal("15.00"));
        when(diaryRepository.save(any(FieldDiaryEntry.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        var response = service.update(plantingId, stepId, request("12.00"));

        assertThat(response.plantedAreaHectares()).isEqualByComparingTo("12.00");
        verify(diaryRepository).save(any(FieldDiaryEntry.class));
    }

    @Test
    void shouldUpdateLinkedDiaryWithoutCreatingDuplicate() {
        UUID plantingId = UUID.randomUUID();
        UUID stepId = UUID.randomUUID();
        UUID diaryId = UUID.randomUUID();
        Planting planting = planting("30.00");
        PlantingStep step = new PlantingStep(
                planting,
                LocalDate.of(2026, 7, 2),
                new BigDecimal("10.00"),
                "BRS 284",
                null,
                null,
                null
        );
        step.linkDiaryEntry(diaryId);
        FieldDiaryEntry diaryEntry = new FieldDiaryEntry(
                planting,
                LocalDate.of(2026, 7, 2),
                ActivityType.PLANTING,
                "Plantio realizado",
                null,
                null,
                null
        );
        when(plantingRepository.findByIdForUpdate(plantingId))
                .thenReturn(Optional.of(planting));
        when(stepRepository.findByIdAndPlantingId(stepId, plantingId))
                .thenReturn(Optional.of(step));
        when(stepRepository.sumAreaByPlantingId(plantingId))
                .thenReturn(new BigDecimal("10.00"));
        when(diaryRepository.findById(diaryId)).thenReturn(Optional.of(diaryEntry));

        service.update(plantingId, stepId, request("12.00"));

        verify(diaryRepository, never()).save(any());
        assertThat(diaryEntry.getActivity()).contains("12 hectares");
    }

    @Test
    void shouldNotAccessStepBelongingToAnotherPlanting() {
        UUID plantingId = UUID.randomUUID();
        UUID stepId = UUID.randomUUID();
        when(plantingRepository.findById(plantingId))
                .thenReturn(Optional.of(planting("30.00")));
        when(stepRepository.findByIdAndPlantingId(stepId, plantingId))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.findById(plantingId, stepId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("neste plantio");
    }

    @Test
    void shouldRejectUnknownPlanting() {
        UUID plantingId = UUID.randomUUID();
        when(plantingRepository.findByIdForUpdate(plantingId))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.create(plantingId, request("5.00")))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining(plantingId.toString());
    }

    private PlantingStepRequest request(String area) {
        return new PlantingStepRequest(
                LocalDate.of(2026, 7, 2),
                new BigDecimal(area),
                "  BRS   284  ",
                LocalTime.of(8, 0),
                LocalTime.of(17, 30),
                "Plantio durante todo o dia"
        );
    }

    private Planting planting(String plannedArea) {
        return new Planting(
                "Soja",
                "2026/2027",
                "Talhão 2",
                new BigDecimal(plannedArea),
                LocalDate.of(2026, 7, 1),
                "BRS 284",
                new BigDecimal("50.000"),
                SeedRateUnit.KILOGRAMS_PER_HECTARE,
                null
        );
    }
}
