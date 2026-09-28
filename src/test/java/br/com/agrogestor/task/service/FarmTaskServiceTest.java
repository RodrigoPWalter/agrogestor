package br.com.agrogestor.task.service;

import br.com.agrogestor.machine.repository.MachineRepository;
import br.com.agrogestor.planting.repository.PlantingRepository;
import br.com.agrogestor.property.entity.Property;
import br.com.agrogestor.property.service.CurrentPropertyService;
import br.com.agrogestor.task.entity.FarmTask;
import br.com.agrogestor.task.entity.FarmTaskCategory;
import br.com.agrogestor.task.entity.FarmTaskStatus;
import br.com.agrogestor.task.entity.FarmTaskUrgency;
import br.com.agrogestor.task.repository.FarmTaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FarmTaskServiceTest {

    private static final UUID PROPERTY_ID = UUID.randomUUID();

    @Mock
    private FarmTaskRepository repository;
    @Mock
    private PlantingRepository plantingRepository;
    @Mock
    private MachineRepository machineRepository;
    @Mock
    private CurrentPropertyService currentProperty;

    private Property property;
    private FarmTaskService service;

    @BeforeEach
    void setUp() {
        property = new Property("Sítio Walter");
        ReflectionTestUtils.setField(property, "id", PROPERTY_ID);
        Clock clock = Clock.fixed(
                Instant.parse("2026-09-28T15:00:00Z"),
                ZoneId.of("America/Sao_Paulo")
        );
        service = new FarmTaskService(
                repository,
                plantingRepository,
                machineRepository,
                currentProperty,
                clock
        );
    }

    @Test
    void shouldKeepFarTaskAtMinimalUrgency() {
        FarmTask task = task(LocalDate.of(2026, 11, 20), 480);

        assertThat(service.calculateUrgency(task)).isEqualTo(FarmTaskUrgency.MINIMAL);
    }

    @Test
    void shouldRaiseUrgencyAsDeadlineApproaches() {
        FarmTask attention = task(LocalDate.of(2026, 9, 30), 120);
        FarmTask urgent = task(LocalDate.of(2026, 9, 28), 900);
        FarmTask overdue = task(LocalDate.of(2026, 9, 27), 60);

        assertThat(service.calculateUrgency(attention)).isEqualTo(FarmTaskUrgency.ATTENTION);
        assertThat(service.calculateUrgency(urgent)).isEqualTo(FarmTaskUrgency.URGENT);
        assertThat(service.calculateUrgency(overdue)).isEqualTo(FarmTaskUrgency.OVERDUE);
    }

    @Test
    void shouldMarkCompletedTaskRegardlessOfDeadline() {
        FarmTask task = task(LocalDate.of(2026, 9, 20), 60);
        task.changeStatus(FarmTaskStatus.COMPLETED);

        assertThat(service.calculateUrgency(task)).isEqualTo(FarmTaskUrgency.COMPLETED);
    }

    @Test
    void shouldNotReadTaskFromAnotherProperty() {
        UUID taskId = UUID.randomUUID();
        when(currentProperty.id()).thenReturn(PROPERTY_ID);
        when(repository.findByIdAndPropertyId(taskId, PROPERTY_ID))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.findById(taskId))
                .hasMessageContaining("Tarefa não encontrada");
    }

    private FarmTask task(LocalDate dueDate, int durationMinutes) {
        return new FarmTask(
                property,
                null,
                null,
                "Revisar a plantadeira",
                FarmTaskCategory.MACHINE,
                dueDate,
                durationMinutes,
                null
        );
    }
}
