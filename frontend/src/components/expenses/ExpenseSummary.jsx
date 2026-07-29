import { CircleDollarSign, LandPlot, ReceiptText, Tags } from "lucide-react";
import { formatCurrency } from "../../utils/formatters";

export function ExpenseSummary({ summary, expenseCount }) {
  return (
    <section
      className="expense-summary-strip"
      aria-label="Resumo financeiro do plantio"
    >
      <article className="expense-summary-item expense-summary-item--financial">
        <span>
          <CircleDollarSign size={21} />
        </span>
        <div>
          <small>Total registrado</small>
          <strong>{formatCurrency(summary?.totalExpenses)}</strong>
        </div>
      </article>
      <article className="expense-summary-item expense-summary-item--financial">
        <span>
          <LandPlot size={21} />
        </span>
        <div>
          <small>Custo por hectare</small>
          <strong>{formatCurrency(summary?.expensePerHectare)}</strong>
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
