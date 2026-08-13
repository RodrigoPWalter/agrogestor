package br.com.agrogestor.machine.repository;

import br.com.agrogestor.machine.entity.Maintenance;
import br.com.agrogestor.machine.entity.MaintenanceType;
import br.com.agrogestor.machine.dto.MachineMaintenanceTotals;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MaintenanceRepository extends JpaRepository<Maintenance, UUID> {
    List<Maintenance> findByMachineIdOrderByMaintenanceDateDesc(UUID machineId);
    Optional<Maintenance> findFirstByMachineIdAndNextReviewHoursIsNotNullOrderByMaintenanceDateDesc(UUID machineId);
    Optional<Maintenance> findByIdAndMachinePropertyId(UUID id, UUID propertyId);

    @Query("""
            select new br.com.agrogestor.machine.dto.MachineMaintenanceTotals(
                maintenance.machine.id,
                sum(maintenance.cost),
                sum(case when maintenance.maintenanceType = :preventive
                    then maintenance.cost else 0 end),
                sum(case when maintenance.maintenanceType = :corrective
                    then maintenance.cost else 0 end),
                count(maintenance.id),
                sum(case when maintenance.maintenanceType = :preventive then 1L else 0L end),
                sum(case when maintenance.maintenanceType = :corrective then 1L else 0L end)
            )
            from Maintenance maintenance
            where maintenance.machine.id in :machineIds
            group by maintenance.machine.id
            """)
    List<MachineMaintenanceTotals> summarizeByMachineIds(
            @Param("machineIds") Collection<UUID> machineIds,
            @Param("preventive") MaintenanceType preventive,
            @Param("corrective") MaintenanceType corrective
    );
}
