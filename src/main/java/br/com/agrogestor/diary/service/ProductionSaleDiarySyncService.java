package br.com.agrogestor.diary.service;

import br.com.agrogestor.diary.entity.ActivityType;
import br.com.agrogestor.diary.entity.FieldDiaryEntry;
import br.com.agrogestor.diary.repository.FieldDiaryRepository;
import br.com.agrogestor.production.entity.ProductionSale;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class ProductionSaleDiarySyncService {

    private final FieldDiaryRepository diaryRepository;

    public ProductionSaleDiarySyncService(FieldDiaryRepository diaryRepository) {
        this.diaryRepository = diaryRepository;
    }

    public void upsert(ProductionSale sale) {
        FieldDiaryEntry entry = diaryRepository.findByProductionSaleId(sale.getId())
                .orElseGet(() -> new FieldDiaryEntry(
                        sale.getProperty(),
                        sale.getPlanting(),
                        sale.getSaleDate(),
                        ActivityType.SALE,
                        description(sale),
                        null,
                        null,
                        sale.getObservations()
                ));
        entry.update(
                sale.getPlanting(),
                sale.getSaleDate(),
                ActivityType.SALE,
                description(sale),
                null,
                null,
                sale.getObservations()
        );
        entry.updateDetails(
                null,
                sale.getBuyer(),
                totalAmount(sale),
                null,
                sale.getQuantityBags(),
                "BAGS_60_KG",
                sale.getPricePerBag()
        );
        entry.linkProductionSale(sale.getId());
        diaryRepository.save(entry);
    }

    public void deleteBySaleId(java.util.UUID saleId) {
        diaryRepository.findByProductionSaleId(saleId)
                .ifPresent(diaryRepository::delete);
    }

    private String description(ProductionSale sale) {
        return "Venda de " + display(sale.getQuantityBags())
                + " sacas de " + sale.getPlanting().getCrop();
    }

    private BigDecimal totalAmount(ProductionSale sale) {
        return sale.getQuantityBags().multiply(sale.getPricePerBag())
                .setScale(2, RoundingMode.HALF_UP);
    }

    private String display(BigDecimal value) {
        return value.stripTrailingZeros().toPlainString().replace(".", ",");
    }
}
