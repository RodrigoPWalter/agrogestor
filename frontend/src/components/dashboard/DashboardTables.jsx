import { ReceiptText, Sprout, Warehouse } from "lucide-react";
import { Link } from "react-router-dom";
import {
  formatCurrency,
  formatDate,
  formatNumber,
} from "../../utils/formatters";

export function InventoryAttentionPanel({ inventoryProducts }) {
  return (
    <section className="panel">
      <div className="panel__header">
        <div>
          <span className="eyebrow">Controle de insumos</span>
          <h2>Estoque em atenção</h2>
        </div>
        <Link to="/estoque" className="text-link">
          Ver estoque
        </Link>
      </div>

      {inventoryProducts.length === 0 ? (
        <div className="compact-empty">
          <Warehouse size={28} />
          <p>Nenhum produto cadastrado ainda.</p>
        </div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table dashboard-inventory-table">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Tipo</th>
                <th>Saldo</th>
                <th>Validade</th>
              </tr>
            </thead>
            <tbody>
              {inventoryProducts.slice(0, 5).map((product) => (
                <tr key={product.id}>
                  <td>
                    <span className="table-primary">{product.name}</span>
                  </td>
                  <td>{product.productTypeName}</td>
                  <td className="numeric-value">
                    {formatNumber(product.quantity, 3)} {product.unitName}
                  </td>
                  <td>
                    {product.expirationDate
                      ? formatDate(product.expirationDate)
                      : "Sem data"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export function RecentPlantingsPanel({ plantings }) {
  return (
    <section className="panel">
      <div className="panel__header">
        <div>
          <span className="eyebrow">Em andamento</span>
          <h2>Plantios ativos</h2>
        </div>
        <Link to="/plantios" className="text-link">
          Ver todos
        </Link>
      </div>

      {plantings.length === 0 ? (
        <div className="compact-empty">
          <Sprout size={28} />
          <p>Nenhum plantio ativo no momento.</p>
        </div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table dashboard-planting-table">
            <thead>
              <tr>
                <th>Cultura</th>
                <th>Safra</th>
                <th>Área</th>
                <th>Início</th>
              </tr>
            </thead>
            <tbody>
              {plantings.slice(0, 5).map((planting) => (
                <tr key={planting.id}>
                  <td>
                    <span className="table-primary">{planting.crop}</span>
                    <small>{planting.seedVariety}</small>
                  </td>
                  <td>{planting.harvest}</td>
                  <td className="numeric-value">
                    {formatNumber(planting.plantedAreaHectares)} de{" "}
                    {formatNumber(planting.plannedAreaHectares)} ha
                  </td>
                  <td>{formatDate(planting.startDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export function RecentExpensesPanel({ expenses }) {
  return (
    <section className="panel">
      <div className="panel__header">
        <div>
          <span className="eyebrow">Finanças</span>
          <h2>Últimos gastos</h2>
        </div>
        <Link to="/gastos" className="text-link">
          Ver gastos
        </Link>
      </div>

      {expenses.length === 0 ? (
        <div className="compact-empty">
          <ReceiptText size={28} />
          <p>Nenhum gasto registrado ainda.</p>
        </div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table dashboard-expense-table">
            <thead>
              <tr>
                <th>Descrição</th>
                <th>Categoria</th>
                <th>Data</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              {expenses.slice(0, 5).map((expense) => (
                <tr key={expense.id}>
                  <td>
                    <span className="table-primary">{expense.description}</span>
                  </td>
                  <td>{expense.categoryDisplayName}</td>
                  <td>{formatDate(expense.expenseDate)}</td>
                  <td className="numeric-value">
                    {formatCurrency(expense.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
