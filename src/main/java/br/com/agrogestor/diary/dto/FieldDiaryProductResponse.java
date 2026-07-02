package br.com.agrogestor.diary.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record FieldDiaryProductResponse(
        UUID productId,
        String productName,
        BigDecimal quantity,
        String unitName
) {}
