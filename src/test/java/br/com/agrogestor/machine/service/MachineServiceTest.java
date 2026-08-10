package br.com.agrogestor.machine.service;

import br.com.agrogestor.expense.entity.Expense;
import br.com.agrogestor.expense.entity.ExpenseCategory;
import br.com.agrogestor.expense.entity.ExpenseOrigin;
import br.com.agrogestor.expense.repository.ExpenseRepository;
import br.com.agrogestor.machine.dto.MaintenanceRequest;
import br.com.agrogestor.machine.entity.Machine;
import br.com.agrogestor.machine.entity.Maintenance;
import br.com.agrogestor.machine.entity.MaintenanceType;
import br.com.agrogestor.machine.repository.MachineRepository;
import br.com.agrogestor.machine.repository.MaintenanceRepository;
import br.com.agrogestor.property.entity.Property;
import br.com.agrogestor.property.service.CurrentPropertyService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MachineServiceTest {

    private static final UUID PROPERTY_ID = UUID.randomUUID();
    private static final UUID MACHINE_ID = UUID.randomUUID();
    private final Property property = new Property("Sítio Walter");

    @Mock
    private MachineRepository machineRepository;
    @Mock
    private MaintenanceRepository maintenanceRepository;
    @Mock
    private ExpenseRepository expenseRepository;
    @Mock
    private CurrentPropertyService currentProperty;

    private MachineService service;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(property, "id", PROPERTY_ID);
        when(currentProperty.id()).thenReturn(PROPERTY_ID);
        org.mockito.Mockito.lenient().when(currentProperty.get()).thenReturn(property);
        service = new MachineService(
                machineRepository,
                maintenanceRepository,
                expenseRepository,
                currentProperty
        );
    }

    @Test
    void shouldCreatePropertyExpenseForMaintenanceCost() {
        Machine machine = machine();
        UUID expenseId = UUID.randomUUID();
        when(machineRepository.findByIdAndPropertyId(MACHINE_ID, PROPERTY_ID))
                .thenReturn(Optional.of(machine));
        when(maintenanceRepository.save(any(Maintenance.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(expenseRepository.save(any(Expense.class))).thenAnswer(invocation -> {
            Expense expense = invocation.getArgument(0);
            ReflectionTestUtils.setField(expense, "id", expenseId);
            return expense;
        });

        service.createMaintenance(MACHINE_ID, request("200.00"));

        ArgumentCaptor<Maintenance> maintenance =
                ArgumentCaptor.forClass(Maintenance.class);
        verify(maintenanceRepository).save(maintenance.capture());
        assertThat(maintenance.getValue().getExpenseId()).isEqualTo(expenseId);

        ArgumentCaptor<Expense> expense = ArgumentCaptor.forClass(Expense.class);
        verify(expenseRepository).save(expense.capture());
        assertThat(expense.getValue().getOrigin()).isEqualTo(ExpenseOrigin.MAINTENANCE);
        assertThat(expense.getValue().getCategory()).isEqualTo(ExpenseCategory.MAINTENANCE);
        assertThat(expense.getValue().getPlanting()).isNull();
        assertThat(expense.getValue().getAmount()).isEqualByComparingTo("200.00");
        assertThat(expense.getValue().getDescription())
                .isEqualTo("Manutenção corretiva — John Deere 6110J");
        assertThat(expense.getValue().getObservations())
                .contains("Peças: filtro de óleo", "Revisão completa");
    }

    @Test
    void shouldUpdateLinkedExpenseWhenMaintenanceChanges() {
        Machine machine = machine();
        UUID maintenanceId = UUID.randomUUID();
        UUID expenseId = UUID.randomUUID();
        Maintenance maintenance = new Maintenance(
                machine,
                LocalDate.of(2026, 8, 9),
                MaintenanceType.CORRECTIVE,
                null,
                new BigDecimal("200.00"),
                null,
                null
        );
        maintenance.linkExpense(expenseId);
        ReflectionTestUtils.setField(maintenance, "id", maintenanceId);
        Expense expense = new Expense(
                property,
                null,
                "Manutenção antiga",
                ExpenseCategory.MAINTENANCE,
                new BigDecimal("200.00"),
                LocalDate.of(2026, 8, 9),
                null,
                ExpenseOrigin.MAINTENANCE
        );
        when(maintenanceRepository.findByIdAndMachinePropertyId(maintenanceId, PROPERTY_ID))
                .thenReturn(Optional.of(maintenance));
        when(expenseRepository.findByIdAndPropertyId(expenseId, PROPERTY_ID))
                .thenReturn(Optional.of(expense));

        service.updateMaintenance(maintenanceId, request("350.00"));

        assertThat(expense.getAmount()).isEqualByComparingTo("350.00");
        assertThat(expense.getExpenseDate()).isEqualTo(LocalDate.of(2026, 8, 10));
        assertThat(expense.getDescription()).contains("John Deere 6110J");
    }

    @Test
    void shouldNotCreateExpenseWhenMaintenanceHasNoCost() {
        Machine machine = machine();
        when(machineRepository.findByIdAndPropertyId(MACHINE_ID, PROPERTY_ID))
                .thenReturn(Optional.of(machine));
        when(maintenanceRepository.save(any(Maintenance.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        service.createMaintenance(MACHINE_ID, request("0.00"));

        verify(expenseRepository, never()).save(any(Expense.class));
    }

    @Test
    void shouldDeleteLinkedExpenseWithMaintenance() {
        UUID maintenanceId = UUID.randomUUID();
        UUID expenseId = UUID.randomUUID();
        Maintenance maintenance = new Maintenance(
                machine(),
                LocalDate.of(2026, 8, 9),
                MaintenanceType.CORRECTIVE,
                null,
                new BigDecimal("200.00"),
                null,
                null
        );
        maintenance.linkExpense(expenseId);
        when(maintenanceRepository.findByIdAndMachinePropertyId(maintenanceId, PROPERTY_ID))
                .thenReturn(Optional.of(maintenance));

        service.deleteMaintenance(maintenanceId);

        InOrder deletion = inOrder(maintenanceRepository, expenseRepository);
        deletion.verify(maintenanceRepository).delete(maintenance);
        deletion.verify(maintenanceRepository).flush();
        deletion.verify(expenseRepository).deleteById(expenseId);
    }

    private Machine machine() {
        Machine machine = new Machine(
                property,
                "6110J",
                "John Deere",
                2020,
                new BigDecimal("100.0")
        );
        ReflectionTestUtils.setField(machine, "id", MACHINE_ID);
        return machine;
    }

    private MaintenanceRequest request(String cost) {
        return new MaintenanceRequest(
                LocalDate.of(2026, 8, 10),
                MaintenanceType.CORRECTIVE,
                "filtro de óleo",
                new BigDecimal(cost),
                new BigDecimal("350.0"),
                "Revisão completa"
        );
    }
}
