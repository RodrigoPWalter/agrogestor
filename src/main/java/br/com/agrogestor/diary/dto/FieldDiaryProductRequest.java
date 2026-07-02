package br.com.agrogestor.diary.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.util.UUID;

public record FieldDiaryProductRequest(
        @NotNull UUID productId,
        @NotNull @DecimalMin("0.001") @Digits(integer = 11, fraction = 3)
        BigDecimal quantity
) {}
