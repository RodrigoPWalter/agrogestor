package br.com.agrogestor.expense.repository;

import br.com.agrogestor.expense.entity.Expense;
import br.com.agrogestor.expense.entity.ExpenseOrigin;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface ExpenseRepository extends JpaRepository<Expense, UUID> {

    Page<Expense> findByPropertyId(UUID propertyId, Pageable pageable);

    Page<Expense> findByPropertyIdAndOriginNot(
            UUID propertyId,
            ExpenseOrigin excludedOrigin,
            Pageable pageable
    );

    Page<Expense> findByPropertyIdAndPlantingIsNullAndOriginNot(
            UUID propertyId,
            ExpenseOrigin excludedOrigin,
            Pageable pageable
    );

    Page<Expense> findByPropertyIdAndPlantingId(UUID propertyId, UUID plantingId, Pageable pageable);

    java.util.Optional<Expense> findByIdAndPropertyId(UUID id, UUID propertyId);

    long countByPlantingId(UUID plantingId);

    @Query("""
            select coalesce(sum(expense.amount), 0)
            from Expense expense
            where expense.property.id = :propertyId
              and expense.origin <> :excludedOrigin
            """)
    BigDecimal sumAllAmountsByPropertyIdAndOriginNot(
            @Param("propertyId") UUID propertyId,
            @Param("excludedOrigin") ExpenseOrigin excludedOrigin
    );

    @Query("""
            select coalesce(sum(expense.amount), 0)
            from Expense expense
            where expense.property.id = :propertyId
              and expense.planting is not null
            """)
    BigDecimal sumPlantingAmountsByPropertyId(
            @Param("propertyId") UUID propertyId
    );

    long countByPropertyIdAndOriginNot(
            UUID propertyId,
            ExpenseOrigin excludedOrigin
    );

    long countByPropertyIdAndPlantingIsNullAndOriginNot(
            UUID propertyId,
            ExpenseOrigin excludedOrigin
    );

    @EntityGraph(attributePaths = "planting")
    List<Expense> findByPropertyIdOrderByExpenseDateDescCreatedAtDesc(
            UUID propertyId, Pageable pageable);

    @EntityGraph(attributePaths = "planting")
    List<Expense> findByPropertyIdAndOriginNotOrderByExpenseDateDescCreatedAtDesc(
            UUID propertyId,
            ExpenseOrigin excludedOrigin,
            Pageable pageable
    );

    @Query("""
            select e.category as category, sum(e.amount) as total
            from Expense e
            where e.planting.id = :plantingId
            group by e.category
            order by e.category
            """)
    List<ExpenseCategoryTotalProjection> summarizeByCategory(
            @Param("plantingId") UUID plantingId
    );

    @Query("""
            select e.category as category, sum(e.amount) as total
            from Expense e
            where e.property.id = :propertyId
              and e.planting is null
              and e.origin <> :excludedOrigin
            group by e.category
            order by e.category
            """)
    List<ExpenseCategoryTotalProjection> summarizeUnassignedByCategory(
            @Param("propertyId") UUID propertyId,
            @Param("excludedOrigin") ExpenseOrigin excludedOrigin
    );
}
