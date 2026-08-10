import { Edit3, Plus, Search, Trash2 } from "lucide-react";
import { EmptyState } from "../Feedback";
import { formatCurrency, formatDate } from "../../utils/formatters";

export function ExpenseTable({
  expenses,
  filteredExpenses,
  searchQuery,
  selectedPlantingId,
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
          <h2>Gastos registrados</h2>
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
          disabled={!selectedPlantingId}
        >
          <Plus size={17} /> Registrar gasto
        </button>
      </div>

      {expenses.length === 0 ? (
        <EmptyState
          title="Nenhum gasto neste plantio"
          description="Registre a primeira despesa para começar o controle."
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
                filteredExpenses.map((expense) => (
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
                    </td>
                    <td>{expense.categoryDisplayName}</td>
                    <td className="expense-table-value">
                      {formatCurrency(expense.amount)}
                    </td>
                    <td className="expense-table-actions">
                      {expense.managedByInventory ? (
                        <span className="managed-expense-copy">
                          Gerenciado no Diário
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
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
