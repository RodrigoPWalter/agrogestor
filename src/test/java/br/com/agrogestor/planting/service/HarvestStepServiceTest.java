package br.com.agrogestor.planting.service;

import br.com.agrogestor.diary.entity.ActivityType;
import br.com.agrogestor.diary.entity.FieldDiaryEntry;
import br.com.agrogestor.diary.repository.FieldDiaryRepository;
import br.com.agrogestor.planting.dto.HarvestStepRequest;
import br.com.agrogestor.planting.entity.HarvestStep;
import br.com.agrogestor.planting.entity.HarvestUnit;
import br.com.agrogestor.planting.entity.Planting;
import br.com.agrogestor.planting.entity.SeedRateUnit;
import br.com.agrogestor.planting.repository.HarvestStepRepository;
import br.com.agrogestor.planting.repository.PlantingRepository;
import br.com.agrogestor.planting.repository.PlantingStepRepository;
import br.com.agrogestor.shared.exception.BusinessRuleException;
import br.com.agrogestor.shared.exception.ResourceNotFoundException;
import br.com.agrogestor.property.entity.Property;
import br.com.agrogestor.property.service.CurrentPropertyService;
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
class HarvestStepServiceTest {

    private static final UUID PROPERTY_ID = UUID.randomUUID();
    private final Property property = new Property("Teste");

    @Mock
    private HarvestStepRepository harvestRepository;

    @Mock
    private PlantingStepRepository plantingStepRepository;

    @Mock
    private PlantingRepository plantingRepository;

    @Mock
    private FieldDiaryRepository diaryRepository;
    @Mock
    private CurrentPropertyService currentProperty;

    private HarvestStepService service;

    @BeforeEach
    void setUp() {
        service = new HarvestStepService(
                harvestRepository,
                plantingStepRepository,
                plantingRepository,
                diaryRepository,
                currentProperty
        );
        org.mockito.Mockito.lenient().when(currentProperty.id()).thenReturn(PROPERTY_ID);
        org.mockito.Mockito.lenient().when(currentProperty.get()).thenReturn(property);
    }

    @Test
    void shouldAddHarvestStepAndCreateDiaryEntry() {
        UUID plantingId = UUID.randomUUID();
        Planting planting = planting();
        when(plantingRepository.findByIdAndPropertyIdForUpdate(plantingId, PROPERTY_ID))
                .thenReturn(Optional.of(planting));
        when(plantingStepRepository.sumAreaByPlantingId(plantingId))
                .thenReturn(new BigDecimal("20.00"));
        when(harvestRepository.sumAreaByPlantingId(plantingId))
                .thenReturn(new BigDecimal("5.00"));
        when(harvestRepository.save(any(HarvestStep.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(diaryRepository.save(any(FieldDiaryEntry.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        var response = service.create(plantingId, request("8.00", "640.000"));

        assertThat(response.harvestedAreaHectares()).isEqualByComparingTo("8.00");
        assertThat(response.harvestQuantity()).isEqualByComparingTo("640.000");
        assertThat(response.harvestUnitName()).isEqualTo("sacas de 60 kg");
        assertThat(response.seedVariety()).isEqualTo("AG 8700");

        ArgumentCaptor<FieldDiaryEntry> diaryCaptor =
                ArgumentCaptor.forClass(FieldDiaryEntry.class);
        verify(diaryRepository).save(diaryCaptor.capture());
        assertThat(diaryCaptor.getValue().getActivityType())
                .isEqualTo(ActivityType.HARVEST);
        assertThat(diaryCaptor.getValue().getActivity())
                .contains("8 ha")
                .contains("640 sacas de 60 kg");
        assertThat(diaryCaptor.getValue().getHarvestQuantity())
                .isEqualByComparingTo("640.000");
    }

    @Test
    void shouldRejectAreaGreaterThanRemainingPlantedArea() {
        UUID plantingId = UUID.randomUUID();
        when(plantingRepository.findByIdAndPropertyIdForUpdate(plantingId, PROPERTY_ID))
                .thenReturn(Optional.of(planting()));
        when(plantingStepRepository.sumAreaByPlantingId(plantingId))
                .thenReturn(new BigDecimal("20.00"));
        when(harvestRepository.sumAreaByPlantingId(plantingId))
                .thenReturn(new BigDecimal("15.00"));

        assertThatThrownBy(() ->
                service.create(plantingId, request("8.00", "640.000")))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("restam apenas 5 hectares");
        verify(harvestRepository, never()).save(any());
        verify(diaryRepository, never()).save(any());
    }

    @Test
    void shouldRejectHarvestBeforeAnyAreaWasPlanted() {
        UUID plantingId = UUID.randomUUID();
        when(plantingRepository.findByIdAndPropertyIdForUpdate(plantingId, PROPERTY_ID))
                .thenReturn(Optional.of(planting()));
        when(plantingStepRepository.sumAreaByPlantingId(plantingId))
                .thenReturn(BigDecimal.ZERO);

        assertThatThrownBy(() ->
                service.create(plantingId, request("1.00", "50.000")))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("hectares plantados");
    }

    @Test
    void shouldRecalculateAvailableAreaWhenEditing() {
        UUID plantingId = UUID.randomUUID();
        UUID stepId = UUID.randomUUID();
        Planting planting = planting();
        HarvestStep step = step(planting, "8.00", "640.000");
        when(plantingRepository.findByIdAndPropertyIdForUpdate(plantingId, PROPERTY_ID))
                .thenReturn(Optional.of(planting));
        when(harvestRepository.findByIdAndPlantingId(stepId, plantingId))
                .thenReturn(Optional.of(step));
        when(plantingStepRepository.sumAreaByPlantingId(plantingId))
                .thenReturn(new BigDecimal("20.00"));
        when(harvestRepository.sumAreaByPlantingId(plantingId))
                .thenReturn(new BigDecimal("15.00"));
        when(diaryRepository.save(any(FieldDiaryEntry.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        var response = service.update(
                plantingId,
                stepId,
                request("10.00", "810.000")
        );

        assertThat(response.harvestedAreaHectares()).isEqualByComparingTo("10.00");
        assertThat(response.harvestQuantity()).isEqualByComparingTo("810.000");
    }

    @Test
    void shouldUpdateLinkedDiaryWithoutCreatingDuplicate() {
        UUID plantingId = UUID.randomUUID();
        UUID stepId = UUID.randomUUID();
        UUID diaryId = UUID.randomUUID();
        Planting planting = planting();
        HarvestStep step = step(planting, "8.00", "640.000");
        step.linkDiaryEntry(diaryId);
        FieldDiaryEntry diaryEntry = new FieldDiaryEntry(
                property,
                planting,
                LocalDate.of(2026, 7, 30),
                ActivityType.HARVEST,
                "Colheita realizada",
                null,
                null,
                null
        );
        when(plantingRepository.findByIdAndPropertyIdForUpdate(plantingId, PROPERTY_ID))
                .thenReturn(Optional.of(planting));
        when(harvestRepository.findByIdAndPlantingId(stepId, plantingId))
                .thenReturn(Optional.of(step));
        when(plantingStepRepository.sumAreaByPlantingId(plantingId))
                .thenReturn(new BigDecimal("20.00"));
        when(harvestRepository.sumAreaByPlantingId(plantingId))
                .thenReturn(new BigDecimal("8.00"));
        when(diaryRepository.findById(diaryId)).thenReturn(Optional.of(diaryEntry));

        service.update(plantingId, stepId, request("9.00", "720.000"));

        verify(diaryRepository, never()).save(any());
        assertThat(diaryEntry.getActivity()).contains("9 ha");
        assertThat(diaryEntry.getHarvestQuantity())
                .isEqualByComparingTo("720.000");
    }

    @Test
    void shouldRejectChangesAfterSeasonIsFinished() {
        UUID plantingId = UUID.randomUUID();
        Planting planting = planting();
        planting.finish();
        when(plantingRepository.findByIdAndPropertyIdForUpdate(plantingId, PROPERTY_ID))
                .thenReturn(Optional.of(planting));

        assertThatThrownBy(() ->
                service.create(plantingId, request("1.00", "50.000")))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("safra finalizada");
    }

    @Test
    void shouldNotAccessStepFromAnotherPlanting() {
        UUID plantingId = UUID.randomUUID();
        UUID stepId = UUID.randomUUID();
        when(plantingRepository.findByIdAndPropertyId(plantingId, PROPERTY_ID))
                .thenReturn(Optional.of(planting()));
        when(harvestRepository.findByIdAndPlantingId(stepId, plantingId))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.findById(plantingId, stepId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("neste plantio");
    }

    private HarvestStepRequest request(String area, String quantity) {
        return new HarvestStepRequest(
                LocalDate.of(2026, 7, 30),
                new BigDecimal(area),
                new BigDecimal(quantity),
                HarvestUnit.BAGS_60_KG,
                "  AG   8700  ",
                LocalTime.of(8, 0),
                LocalTime.of(17, 30),
                "Colheita interrompida devido à umidade"
        );
    }

    private HarvestStep step(
            Planting planting,
            String area,
            String quantity
    ) {
        return new HarvestStep(
                planting,
                LocalDate.of(2026, 7, 30),
                new BigDecimal(area),
                new BigDecimal(quantity),
                HarvestUnit.BAGS_60_KG,
                "AG 8700",
                null,
                null,
                null
        );
    }

    private Planting planting() {
        return new Planting(
                property,
                "Milho",
                "2026",
                "Talhão 1",
                new BigDecimal("20.00"),
                LocalDate.of(2026, 7, 1),
                "AG 8700",
                new BigDecimal("60000"),
                SeedRateUnit.SEEDS_PER_HECTARE,
                null
        );
    }
}
