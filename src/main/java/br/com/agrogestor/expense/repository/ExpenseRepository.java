package br.com.agrogestor.expense.repository;

import br.com.agrogestor.expense.entity.Expense;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface ExpenseRepository extends JpaRepository<Expense, UUID> {

    Page<Expense> findByPlantingId(UUID plantingId, Pageable pageable);

    long countByPlantingId(UUID plantingId);

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
}
