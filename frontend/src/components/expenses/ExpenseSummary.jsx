import { CircleDollarSign, LandPlot, ReceiptText, Tags } from "lucide-react";
import { formatCurrency } from "../../utils/formatters";

export function ExpenseSummary({ summary, expenseCount, scope }) {
  const propertyScope = scope === "property";

  return (
    <section
      className="expense-summary-strip"
      aria-label={
        propertyScope
          ? "Resumo dos gastos da propriedade"
          : "Resumo financeiro do plantio"
      }
    >
      <article className="expense-summary-item expense-summary-item--financial">
        <span>
          <CircleDollarSign size={21} />
        </span>
        <div>
          <small>
            {propertyScope ? "Total da propriedade" : "Total registrado"}
          </small>
          <strong>{formatCurrency(summary?.totalExpenses)}</strong>
        </div>
      </article>
      <article className="expense-summary-item expense-summary-item--financial">
        <span>
          <LandPlot size={21} />
        </span>
        <div>
          <small>
            {propertyScope ? "Média por lançamento" : "Custo por hectare"}
          </small>
          <strong>
            {formatCurrency(
              propertyScope
                ? summary?.averageExpense
                : summary?.expensePerHectare,
            )}
          </strong>
        </div>
      </article>
      <article className="expense-summary-item">
        <span>
          <ReceiptText size={21} />
        </span>
        <div>
          <small>Lançamentos</small>
          <strong>{expenseCount}</strong>
        </div>
      </article>
      <article className="expense-summary-item">
        <span>
          <Tags size={21} />
        </span>
        <div>
          <small>Categorias usadas</small>
          <strong>{summary?.categories?.length || 0}</strong>
        </div>
      </article>
    </section>
  );
}
