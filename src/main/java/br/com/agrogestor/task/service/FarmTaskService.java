package br.com.agrogestor.task.service;

import br.com.agrogestor.machine.entity.Machine;
import br.com.agrogestor.machine.repository.MachineRepository;
import br.com.agrogestor.planting.entity.Planting;
import br.com.agrogestor.planting.repository.PlantingRepository;
import br.com.agrogestor.property.service.CurrentPropertyService;
import br.com.agrogestor.shared.dto.PageResponse;
import br.com.agrogestor.shared.exception.ResourceNotFoundException;
import br.com.agrogestor.task.dto.FarmTaskRequest;
import br.com.agrogestor.task.dto.FarmTaskResponse;
import br.com.agrogestor.task.entity.FarmTask;
import br.com.agrogestor.task.entity.FarmTaskStatus;
import br.com.agrogestor.task.entity.FarmTaskUrgency;
import br.com.agrogestor.task.repository.FarmTaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.time.ZoneId;
import java.util.UUID;

@Service
public class FarmTaskService {

    private static final long ATTENTION_WINDOW_MINUTES = 3L * 24 * 60;

    private final FarmTaskRepository repository;
    private final PlantingRepository plantingRepository;
    private final MachineRepository machineRepository;
    private final CurrentPropertyService currentProperty;
    private final Clock clock;

    @Autowired
    public FarmTaskService(
            FarmTaskRepository repository,
            PlantingRepository plantingRepository,
            MachineRepository machineRepository,
            CurrentPropertyService currentProperty,
            @Value("${agrogestor.business-time-zone:America/Sao_Paulo}") String businessTimeZone
    ) {
        this(
                repository,
                plantingRepository,
                machineRepository,
                currentProperty,
                Clock.system(ZoneId.of(businessTimeZone))
        );
    }

    FarmTaskService(
            FarmTaskRepository repository,
            PlantingRepository plantingRepository,
            MachineRepository machineRepository,
            CurrentPropertyService currentProperty,
            Clock clock
    ) {
        this.repository = repository;
        this.plantingRepository = plantingRepository;
        this.machineRepository = machineRepository;
        this.currentProperty = currentProperty;
        this.clock = clock;
    }

    @Transactional
    public FarmTaskResponse create(FarmTaskRequest request) {
        FarmTask task = new FarmTask(
                currentProperty.get(),
                findOptionalPlanting(request.plantingId()),
                findOptionalMachine(request.machineId()),
                normalize(request.title()),
                request.category(),
                request.dueDate(),
                request.estimatedDurationMinutes(),
                normalizeNullable(request.notes())
        );
        return toResponse(repository.save(task));
    }

    @Transactional(readOnly = true)
    public PageResponse<FarmTaskResponse> findAll(
            FarmTaskStatus status,
            boolean openOnly,
            int page,
            int size
    ) {
        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by(Sort.Direction.ASC, "dueDate")
                        .and(Sort.by(Sort.Direction.ASC, "createdAt"))
        );
        UUID propertyId = currentProperty.id();
        Page<FarmTask> result;
        if (status != null) {
            result = repository.findByPropertyIdAndStatus(propertyId, status, pageable);
        } else if (openOnly) {
            result = repository.findByPropertyIdAndStatusNot(
                    propertyId,
                    FarmTaskStatus.COMPLETED,
                    pageable
            );
        } else {
            result = repository.findByPropertyId(propertyId, pageable);
        }
        return PageResponse.from(result.map(this::toResponse));
    }

    @Transactional(readOnly = true)
    public FarmTaskResponse findById(UUID id) {
        return toResponse(findTask(id));
    }

    @Transactional
    public FarmTaskResponse update(UUID id, FarmTaskRequest request) {
        FarmTask task = findTask(id);
        task.update(
                findOptionalPlanting(request.plantingId()),
                findOptionalMachine(request.machineId()),
                normalize(request.title()),
                request.category(),
                request.dueDate(),
                request.estimatedDurationMinutes(),
                normalizeNullable(request.notes())
        );
        return toResponse(task);
    }

    @Transactional
    public FarmTaskResponse changeStatus(UUID id, FarmTaskStatus status) {
        FarmTask task = findTask(id);
        task.changeStatus(status);
        return toResponse(task);
    }

    @Transactional
    public void delete(UUID id) {
        repository.delete(findTask(id));
    }

    FarmTaskUrgency calculateUrgency(FarmTask task) {
        if (task.getStatus() == FarmTaskStatus.COMPLETED) {
            return FarmTaskUrgency.COMPLETED;
        }

        ZonedDateTime now = ZonedDateTime.now(clock);
        LocalDate today = now.toLocalDate();
        if (task.getDueDate().isBefore(today)) {
            return FarmTaskUrgency.OVERDUE;
        }
        if (task.getDueDate().isEqual(today)) {
            return FarmTaskUrgency.URGENT;
        }
        ZonedDateTime deadline = task.getDueDate()
                .plusDays(1)
                .atStartOfDay(clock.getZone());
        long availableMinutes = Duration.between(now, deadline).toMinutes();
        long estimatedMinutes = task.getEstimatedDurationMinutes();
        if (availableMinutes <= estimatedMinutes) {
            return FarmTaskUrgency.URGENT;
        }

        long attentionThreshold = Math.max(
                estimatedMinutes * 3,
                ATTENTION_WINDOW_MINUTES
        );
        return availableMinutes <= attentionThreshold
                ? FarmTaskUrgency.ATTENTION
                : FarmTaskUrgency.MINIMAL;
    }

    private FarmTask findTask(UUID id) {
        return repository.findByIdAndPropertyId(id, currentProperty.id())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Tarefa não encontrada com o ID " + id
                ));
    }

    private Planting findOptionalPlanting(UUID id) {
        if (id == null) return null;
        return plantingRepository.findByIdAndPropertyId(id, currentProperty.id())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Plantio não encontrado com o ID " + id
                ));
    }

    private Machine findOptionalMachine(UUID id) {
        if (id == null) return null;
        return machineRepository.findByIdAndPropertyId(id, currentProperty.id())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Máquina não encontrada com o ID " + id
                ));
    }

    private FarmTaskResponse toResponse(FarmTask task) {
        Planting planting = task.getPlanting();
        Machine machine = task.getMachine();
        FarmTaskUrgency urgency = calculateUrgency(task);
        return new FarmTaskResponse(
                task.getId(),
                task.getTitle(),
                task.getCategory(),
                task.getCategory().getDisplayName(),
                task.getStatus(),
                task.getStatus().getDisplayName(),
                urgency,
                urgency.getDisplayName(),
                task.getDueDate(),
                task.getEstimatedDurationMinutes(),
                planting == null ? null : planting.getId(),
                planting == null ? null : planting.getCrop() + " — " + planting.getHarvest(),
                machine == null ? null : machine.getId(),
                machine == null ? null : machine.getBrand() + " " + machine.getModel(),
                task.getNotes(),
                task.getCompletedAt(),
                task.getCreatedAt(),
                task.getUpdatedAt()
        );
    }

    private String normalize(String value) {
        return value.trim().replaceAll("\\s+", " ");
    }

    private String normalizeNullable(String value) {
        return value == null || value.isBlank() ? null : normalize(value);
    }
}
