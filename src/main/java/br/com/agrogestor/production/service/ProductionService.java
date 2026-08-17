package br.com.agrogestor.production.service;

import br.com.agrogestor.planting.entity.Planting;
import br.com.agrogestor.planting.repository.PlantingRepository;
import br.com.agrogestor.production.dto.ProductionSaleRequest;
import br.com.agrogestor.production.dto.ProductionSaleResponse;
import br.com.agrogestor.production.dto.ProductionStockResponse;
import br.com.agrogestor.production.entity.ProductionSale;
import br.com.agrogestor.production.repository.ProductionSaleRepository;
import br.com.agrogestor.property.service.CurrentPropertyService;
import br.com.agrogestor.shared.exception.BusinessRuleException;
import br.com.agrogestor.shared.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ProductionService {

    private final ProductionSaleRepository saleRepository;
    private final PlantingRepository plantingRepository;
    private final ProductionBalanceService balanceService;
    private final CurrentPropertyService currentProperty;

    public ProductionService(
            ProductionSaleRepository saleRepository,
            PlantingRepository plantingRepository,
            ProductionBalanceService balanceService,
            CurrentPropertyService currentProperty
    ) {
        this.saleRepository = saleRepository;
        this.plantingRepository = plantingRepository;
        this.balanceService = balanceService;
        this.currentProperty = currentProperty;
    }

    @Transactional
    public ProductionSaleResponse createSale(
            UUID plantingId,
            ProductionSaleRequest request
    ) {
        Planting planting = findPlantingForUpdate(plantingId);
        validateSaleDate(planting, request);
        BigDecimal quantity = quantity(request.quantityBags());
        balanceService.ensureSaleFitsStock(plantingId, quantity);

        ProductionSale sale = new ProductionSale(
                planting.getProperty(),
                planting,
                request.saleDate(),
                quantity,
                money(request.pricePerBag()),
                normalizeNullable(request.buyer()),
                normalizeNullable(request.observations())
        );
        return toResponse(saleRepository.save(sale));
    }

    @Transactional(readOnly = true)
    public List<ProductionSaleResponse> findSales(UUID plantingId) {
        findPlanting(plantingId);
        return salesForPlanting(plantingId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProductionSaleResponse findSale(UUID plantingId, UUID saleId) {
        findPlanting(plantingId);
        return toResponse(findSaleEntity(plantingId, saleId));
    }

    @Transactional
    public ProductionSaleResponse updateSale(
            UUID plantingId,
            UUID saleId,
            ProductionSaleRequest request
    ) {
        Planting planting = findPlantingForUpdate(plantingId);
        ProductionSale sale = findSaleEntity(plantingId, saleId);
        validateSaleDate(planting, request);

        BigDecimal requestedQuantity = quantity(request.quantityBags());
        BigDecimal availableWithCurrentSale = balanceService.availableBags(plantingId)
                .add(sale.getQuantityBags());
        if (requestedQuantity.compareTo(availableWithCurrentSale) > 0) {
            throw new BusinessRuleException(
                    "Você informou " + display(requestedQuantity)
                            + " sacas, mas há apenas "
                            + display(availableWithCurrentSale)
                            + " sacas disponíveis para esta venda"
            );
        }

        sale.update(
                request.saleDate(),
                requestedQuantity,
                money(request.pricePerBag()),
                normalizeNullable(request.buyer()),
                normalizeNullable(request.observations())
        );
        return toResponse(sale);
    }

    @Transactional
    public void deleteSale(UUID plantingId, UUID saleId) {
        findPlantingForUpdate(plantingId);
        saleRepository.delete(findSaleEntity(plantingId, saleId));
    }

    @Transactional(readOnly = true)
    public ProductionStockResponse stockForPlanting(UUID plantingId) {
        Planting planting = findPlanting(plantingId);
        return stockResponse(
                planting,
                balanceService.harvestedBags(plantingId),
                salesForPlanting(plantingId)
        );
    }

    @Transactional(readOnly = true)
    public List<ProductionStockResponse> findProductionStock() {
        UUID propertyId = currentProperty.id();
        Map<UUID, BigDecimal> harvestedByPlanting =
                balanceService.harvestedBagsByProperty(propertyId);
        Map<UUID, List<ProductionSale>> salesByPlanting = saleRepository
                .findByPropertyIdOrderBySaleDateDescCreatedAtDesc(propertyId)
                .stream()
                .collect(Collectors.groupingBy(sale -> sale.getPlanting().getId()));

        return plantingRepository.findByPropertyIdOrderByStartDateDescCropAsc(propertyId)
                .stream()
                .map(planting -> stockResponse(
                        planting,
                        harvestedByPlanting.getOrDefault(
                                planting.getId(), quantity(BigDecimal.ZERO)),
                        salesByPlanting.getOrDefault(planting.getId(), List.of())
                ))
                .filter(stock -> stock.harvestedBags().signum() > 0
                        || stock.saleCount() > 0)
                .toList();
    }

    private ProductionStockResponse stockResponse(
            Planting planting,
            BigDecimal harvested,
            List<ProductionSale> sales
    ) {
        BigDecimal sold = sales.stream()
                .map(ProductionSale::getQuantityBags)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal revenue = sales.stream()
                .map(this::totalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal averagePrice = sold.signum() == 0
                ? BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP)
                : money(revenue.divide(sold, 2, RoundingMode.HALF_UP));

        return new ProductionStockResponse(
                planting.getId(),
                planting.getCrop(),
                planting.getHarvest(),
                planting.getFieldName(),
                planting.getStatus(),
                quantity(harvested),
                quantity(sold),
                quantity(harvested.subtract(sold)),
                money(revenue),
                averagePrice,
                sales.size()
        );
    }

    private List<ProductionSale> salesForPlanting(UUID plantingId) {
        return saleRepository
                .findByPlantingIdAndPropertyIdOrderBySaleDateDescCreatedAtDesc(
                        plantingId, currentProperty.id());
    }

    private Planting findPlanting(UUID plantingId) {
        return plantingRepository.findByIdAndPropertyId(plantingId, currentProperty.id())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Plantio não encontrado com o ID " + plantingId));
    }

    private Planting findPlantingForUpdate(UUID plantingId) {
        return plantingRepository.findByIdAndPropertyIdForUpdate(
                        plantingId, currentProperty.id())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Plantio não encontrado com o ID " + plantingId));
    }

    private ProductionSale findSaleEntity(UUID plantingId, UUID saleId) {
        return saleRepository.findByIdAndPlantingIdAndPropertyId(
                        saleId, plantingId, currentProperty.id())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Venda não encontrada neste plantio"));
    }

    private void validateSaleDate(Planting planting, ProductionSaleRequest request) {
        if (request.saleDate().isBefore(planting.getStartDate())) {
            throw new BusinessRuleException(
                    "A data da venda não pode ser anterior ao início do plantio");
        }
    }

    private ProductionSaleResponse toResponse(ProductionSale sale) {
        return new ProductionSaleResponse(
                sale.getId(),
                sale.getPlanting().getId(),
                sale.getSaleDate(),
                sale.getQuantityBags(),
                sale.getPricePerBag(),
                totalAmount(sale),
                sale.getBuyer(),
                sale.getObservations(),
                sale.getCreatedAt(),
                sale.getUpdatedAt()
        );
    }

    private BigDecimal totalAmount(ProductionSale sale) {
        return money(sale.getQuantityBags().multiply(sale.getPricePerBag()));
    }

    private BigDecimal money(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal quantity(BigDecimal value) {
        return value.setScale(3, RoundingMode.HALF_UP);
    }

    private String normalizeNullable(String value) {
        return value == null || value.isBlank()
                ? null
                : value.trim().replaceAll("\\s+", " ");
    }

    private String display(BigDecimal value) {
        return value.stripTrailingZeros().toPlainString().replace(".", ",");
    }
}
