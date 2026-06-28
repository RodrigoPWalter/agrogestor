package br.com.agrogestor.production.service;

import br.com.agrogestor.production.dto.ProductionEstimateRequest;
import br.com.agrogestor.production.dto.ProductionEstimateResponse;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class ProductionEstimateService {

    private static final int RESULT_SCALE = 2;
    private static final RoundingMode ROUNDING_MODE = RoundingMode.HALF_UP;

    public ProductionEstimateResponse calculate(ProductionEstimateRequest request) {
        BigDecimal production = request.hectares()
                .multiply(request.expectedYieldBagsPerHectare());

        BigDecimal grossRevenue = production
                .multiply(request.estimatedPricePerBag());

        BigDecimal totalCost = request.totalEstimatedCost() != null
                ? request.totalEstimatedCost()
                : request.hectares().multiply(request.costPerHectare());

        BigDecimal profit = grossRevenue.subtract(totalCost);

        return new ProductionEstimateResponse(
                moneyOrQuantity(production),
                moneyOrQuantity(grossRevenue),
                moneyOrQuantity(totalCost),
                moneyOrQuantity(profit)
        );
    }

    private BigDecimal moneyOrQuantity(BigDecimal value) {
        return value.setScale(RESULT_SCALE, ROUNDING_MODE);
    }
}
