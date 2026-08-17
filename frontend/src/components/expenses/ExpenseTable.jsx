import { Edit3, Plus, Search, Trash2 } from "lucide-react";
import { EmptyState } from "../Feedback";
import {
  formatCurrency,
  formatDate,
  formatNumber,
} from "../../utils/formatters";

export function ExpenseTable({
  expenses,
  filteredExpenses,
  searchQuery,
  canCreate,
  scope,
  onSearchChange,
  onCreate,
  onEdit,
  onDelete,
}) {
  return (
    <section className="panel expense-history-panel">
      <div className="panel__header">
        <div>
          <span className="eyebrow">Histórico</span>
          <h2>
            {scope === "property"
              ? "Gastos da propriedade"
              : "Gastos registrados"}
          </h2>
        </div>
        <span className="record-count">
          {filteredExpenses.length} de {expenses.length} itens
        </span>
      </div>

      <div className="expenses-table-toolbar">
        <label className="expenses-search">
          <Search size={16} />
          <span className="sr-only">Pesquisar gastos</span>
          <input
            type="search"
            value={searchQuery}
            onChange={onSearchChange}
            placeholder="Pesquisar descrição ou categoria"
          />
        </label>
        <button
          className="button button--primary"
          onClick={onCreate}
          disabled={!canCreate}
        >
          <Plus size={17} /> Registrar gasto
        </button>
      </div>

      {expenses.length === 0 ? (
        <EmptyState
          title={
            scope === "property"
              ? "Nenhum gasto geral registrado"
              : "Nenhum gasto neste plantio"
          }
          description={
            scope === "property"
              ? "Use esta área para despesas que não pertencem a uma safra específica."
              : "Registre a primeira despesa para começar o controle."
          }
        />
      ) : (
        <div className="expense-table-wrapper">
          <table className="expense-data-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Descrição</th>
                <th>Categoria</th>
                <th className="expense-table-value">Valor</th>
                <th className="expense-table-actions">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td className="expense-table-empty" colSpan="5">
                    Nenhum lançamento corresponde à pesquisa.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => {
                  const managedExpense =
                    expense.managedByInventory ||
                    expense.managedByMaintenance ||
                    expense.managedByDiary;
                  return (
                    <tr key={expense.id}>
                      <td>{formatDate(expense.expenseDate)}</td>
                      <td>
                        <strong className="expense-description">
                          {expense.description}
                        </strong>
                        {expense.managedByInventory && (
                          <small className="expense-origin-label">
                            Do estoque
                          </small>
                        )}
                        {expense.managedByMaintenance && (
                          <small className="expense-origin-label">
                            Manutenção
                          </small>
                        )}
                        {expense.managedByDiary && (
                          <small className="expense-origin-label">Diário</small>
                        )}
                      </td>
                      <td>
                        {expense.categoryDisplayName}
                        {expense.fuelLiters && (
                          <small className="expense-origin-label">
                            {formatNumber(expense.fuelLiters, 3)} L ·{" "}
                            {formatCurrency(
                              expense.amount / expense.fuelLiters,
                            )}
                            /L
                          </small>
                        )}
                      </td>
                      <td className="expense-table-value">
                        {formatCurrency(expense.amount)}
                      </td>
                      <td className="expense-table-actions">
                        {managedExpense ? (
                          <span className="managed-expense-copy">
                            {expense.managedByMaintenance
                              ? "Gerenciado em Máquinas"
                              : "Gerenciado no Diário"}
                          </span>
                        ) : (
                          <div>
                            <button
                              className="icon-button"
                              onClick={() => onEdit(expense)}
                              aria-label="Editar gasto"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button
                              className="icon-button icon-button--danger"
                              onClick={() => onDelete(expense)}
                              aria-label="Excluir gasto"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
