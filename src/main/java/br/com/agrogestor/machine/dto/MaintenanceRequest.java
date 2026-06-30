package br.com.agrogestor.machine.dto;

import br.com.agrogestor.machine.entity.MaintenanceType;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;

public record MaintenanceRequest(
        @NotNull LocalDate maintenanceDate,
        @NotNull MaintenanceType maintenanceType,
        @Size(max = 1000) String replacedParts,
        @NotNull @DecimalMin("0.0") @Digits(integer = 12, fraction = 2) BigDecimal cost,
        @DecimalMin("0.1") @Digits(integer = 10, fraction = 1) BigDecimal nextReviewHours,
        @Size(max = 1000) String notes
) {}
