package br.com.agrogestor.planting.repository;

import java.math.BigDecimal;
import java.util.UUID;

public interface HarvestAreaTotalProjection {
    UUID getPlantingId();

    BigDecimal getHarvestedArea();
}
