package br.com.agrogestor.seeding.service;

import br.com.agrogestor.seeding.dto.SeedingEstimateRequest;
import br.com.agrogestor.seeding.dto.SeedingEstimateResponse;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class SeedingEstimateService {

    private static final BigDecimal SQUARE_METERS_PER_HECTARE = BigDecimal.valueOf(10_000);
    private static final BigDecimal CENTIMETERS_PER_METER = BigDecimal.valueOf(100);
    private static final BigDecimal PERCENT = BigDecimal.valueOf(100);
    private static final BigDecimal SEED_WEIGHT_CONVERSION = BigDecimal.valueOf(1_000_000);
    private static final RoundingMode ROUNDING_MODE = RoundingMode.HALF_UP;

    public SeedingEstimateResponse calculate(SeedingEstimateRequest request) {
        BigDecimal rowSpacingMeters = request.rowSpacingCentimeters()
                .divide(CENTIMETERS_PER_METER, 6, ROUNDING_MODE);

        BigDecimal totalRowLength = request.hectares()
                .multiply(SQUARE_METERS_PER_HECTARE)
                .divide(rowSpacingMeters, 6, ROUNDING_MODE);

        BigDecimal totalSeeds = request.totalSeedCount() != null
                ? request.totalSeedCount()
                : request.totalSeedWeightKilograms()
                        .multiply(SEED_WEIGHT_CONVERSION)
                        .divide(request.thousandSeedWeightGrams(), 6, ROUNDING_MODE);

        BigDecimal seedsPerHectare = totalSeeds
                .divide(request.hectares(), 6, ROUNDING_MODE);
        BigDecimal seedsPerLinearMeter = totalSeeds
                .divide(totalRowLength, 6, ROUNDING_MODE);

        BigDecimal establishmentRate = request.germinationPercentage()
                .divide(PERCENT, 8, ROUNDING_MODE)
                .multiply(request.fieldEmergencePercentage()
                        .divide(PERCENT, 8, ROUNDING_MODE));

        return new SeedingEstimateResponse(
                totalSeeds.setScale(0, ROUNDING_MODE),
                totalRowLength.setScale(2, ROUNDING_MODE),
                seedsPerHectare.setScale(0, ROUNDING_MODE),
                seedsPerLinearMeter.setScale(2, ROUNDING_MODE),
                seedsPerHectare.multiply(establishmentRate).setScale(0, ROUNDING_MODE),
                seedsPerLinearMeter.multiply(establishmentRate).setScale(2, ROUNDING_MODE)
        );
    }
}
