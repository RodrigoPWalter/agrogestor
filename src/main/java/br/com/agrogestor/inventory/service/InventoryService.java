package br.com.agrogestor.inventory.service;

import br.com.agrogestor.inventory.dto.InventoryMovementRequest;
import br.com.agrogestor.inventory.dto.InventoryMovementResponse;
import br.com.agrogestor.inventory.dto.InventoryProductRequest;
import br.com.agrogestor.inventory.dto.InventoryProductResponse;
import br.com.agrogestor.inventory.dto.InventoryProductUpdateRequest;
import br.com.agrogestor.inventory.entity.InventoryMovement;
import br.com.agrogestor.inventory.entity.InventoryProduct;
import br.com.agrogestor.inventory.repository.InventoryMovementRepository;
import br.com.agrogestor.inventory.repository.InventoryProductRepository;
import br.com.agrogestor.shared.exception.ResourceNotFoundException;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class InventoryService {

    private final InventoryProductRepository productRepository;
    private final InventoryMovementRepository movementRepository;

    public InventoryService(InventoryProductRepository productRepository,
                            InventoryMovementRepository movementRepository) {
        this.productRepository = productRepository;
        this.movementRepository = movementRepository;
    }

    @Transactional
    public InventoryProductResponse create(InventoryProductRequest request) {
        InventoryProduct product = new InventoryProduct(
                normalize(request.name()), request.productType(), quantity(request.initialQuantity()),
                request.unit(), quantity(request.minimumStock()), request.expirationDate()
        );
        return toResponse(productRepository.save(product));
    }

    @Transactional(readOnly = true)
    public List<InventoryProductResponse> findAll() {
        return productRepository.findAll(Sort.by("name")).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public InventoryProductResponse findById(UUID id) {
        return toResponse(findProduct(id));
    }

    @Transactional
    public InventoryProductResponse update(UUID id, InventoryProductUpdateRequest request) {
        InventoryProduct product = findProduct(id);
        product.update(normalize(request.name()), request.productType(), request.unit(),
                quantity(request.minimumStock()), request.expirationDate());
        return toResponse(product);
    }

    @Transactional
    public void delete(UUID id) {
        productRepository.delete(findProduct(id));
    }

    @Transactional
    public InventoryProductResponse move(UUID id, InventoryMovementRequest request) {
        InventoryProduct product = findProduct(id);
        BigDecimal amount = quantity(request.quantity());
        product.applyMovement(request.movementType(), amount);
        movementRepository.save(new InventoryMovement(
                product, request.movementType(), amount, request.movementDate(),
                normalizeNullable(request.notes())
        ));
        return toResponse(product);
    }

    @Transactional(readOnly = true)
    public List<InventoryMovementResponse> movements(UUID productId) {
        findProduct(productId);
        return movementRepository
                .findTop50ByProductIdOrderByMovementDateDescCreatedAtDesc(productId)
                .stream().map(this::toResponse).toList();
    }

    private InventoryProduct findProduct(UUID id) {
        return productRepository.findById(id).orElseThrow(() ->
                new ResourceNotFoundException("Produto não encontrado com o ID " + id));
    }

    private InventoryProductResponse toResponse(InventoryProduct product) {
        return new InventoryProductResponse(
                product.getId(), product.getName(), product.getProductType(),
                product.getProductType().getDisplayName(), product.getQuantity(),
                product.getUnit(), product.getUnit().getDisplayName(), product.getMinimumStock(),
                product.getExpirationDate(),
                product.getQuantity().compareTo(product.getMinimumStock()) <= 0,
                product.getExpirationDate() != null && product.getExpirationDate().isBefore(LocalDate.now()),
                product.getCreatedAt(), product.getUpdatedAt()
        );
    }

    private InventoryMovementResponse toResponse(InventoryMovement movement) {
        return new InventoryMovementResponse(
                movement.getId(), movement.getProduct().getId(), movement.getProduct().getName(),
                movement.getMovementType(), movement.getMovementType().getDisplayName(),
                movement.getQuantity(), movement.getMovementDate(), movement.getNotes(),
                movement.getCreatedAt()
        );
    }

    private BigDecimal quantity(BigDecimal value) {
        return value.setScale(3, RoundingMode.HALF_UP);
    }

    private String normalize(String value) {
        return value.trim().replaceAll("\\s+", " ");
    }

    private String normalizeNullable(String value) {
        return value == null || value.isBlank() ? null : normalize(value);
    }
}
