package br.com.agrogestor.rainfall.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;

public record RainfallRequest(
        @NotNull @PastOrPresent LocalDate measurementDate,
        @NotNull @DecimalMin("0.0") @Digits(integer = 6, fraction = 2) BigDecimal millimeters,
        @Size(max = 500) String notes
) {}
