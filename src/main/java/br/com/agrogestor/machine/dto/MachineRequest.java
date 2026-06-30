package br.com.agrogestor.machine.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record MachineRequest(
        @NotBlank @Size(max = 120) String model,
        @NotBlank @Size(max = 100) String brand,
        @NotNull @Min(1900) @Max(2100) Integer manufactureYear,
        @NotNull @DecimalMin("0.0") @Digits(integer = 10, fraction = 1) BigDecimal usageHours
) {}
