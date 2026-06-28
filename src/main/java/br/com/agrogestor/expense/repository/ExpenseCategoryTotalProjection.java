package br.com.agrogestor.expense.repository;

import br.com.agrogestor.expense.entity.ExpenseCategory;

import java.math.BigDecimal;

public interface ExpenseCategoryTotalProjection {

    ExpenseCategory getCategory();

    BigDecimal getTotal();
}
