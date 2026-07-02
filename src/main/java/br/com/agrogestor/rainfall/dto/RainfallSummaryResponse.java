package br.com.agrogestor.rainfall.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record RainfallSummaryResponse(
        BigDecimal currentMonthTotal,
        BigDecimal lastThirtyDaysTotal,
        LocalDate lastMeasurementDate,
        BigDecimal lastMeasurementMillimeters
) {}
