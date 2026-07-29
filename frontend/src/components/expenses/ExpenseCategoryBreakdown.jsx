import { Tags } from "lucide-react";
import { formatCurrency, formatNumber } from "../../utils/formatters";

export function ExpenseCategoryBreakdown({ categories = [] }) {
  return (
    <section className="panel expense-category-panel">
      <div className="panel__header">
        <div>
          <span className="eyebrow">Distribuição</span>
          <h2>Gastos por categoria</h2>
        </div>
      </div>
      {categories.length === 0 ? (
        <div className="compact-empty">
          <Tags size={28} />
          <p>As categorias aparecerão aqui.</p>
        </div>
      ) : (
        <div className="category-breakdown">
          {categories.map((category) => (
            <article key={category.category}>
              <div className="category-breakdown__row">
                <div>
                  <strong>{category.categoryDisplayName}</strong>
                  <small>{formatCurrency(category.total)}</small>
                </div>
                <span>{formatNumber(category.percentage)}%</span>
              </div>
              <div className="progress-track">
                <span style={{ width: `${category.percentage}%` }} />
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
