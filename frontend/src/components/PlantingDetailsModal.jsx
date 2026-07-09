import {
  BarChart3,
  BookOpenText,
  CheckCircle2,
  CloudRain,
  Plus,
  ReceiptText,
  RotateCcw,
  TrendingUp,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import {
  formatCurrency,
  formatDate,
  formatNumber,
  toInputDate,
} from "../utils/formatters";
import { EmptyState, ErrorBanner, LoadingState } from "./Feedback";
import { Modal } from "./Modal";

const emptyExpense = {
  description: "",
  category: "FERTILIZERS",
  amount: "",
  expenseDate: toInputDate(),
  observations: "",
};

export function PlantingDetailsModal({
  planting,
  onClose,
  onFinish,
  onReactivate,
  onChanged,
}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expense, setExpense] = useState(emptyExpense);
  const [salePrice, setSalePrice] = useState("");
  const [closingLoading, setClosingLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [summary, expenses, diary, rainfall, closing] = await Promise.all([
        api.getExpenseSummary(planting.id),
        api.getExpenses(planting.id),
        api.getDiaryEntries(planting.id),
        api.getRainfallByPlanting(planting.id).catch(() => []),
        api.getSeasonClosing(planting.id),
      ]);
      setData({
        summary,
        expenses: expenses.content,
        diary: diary.content,
        rainfall,
        closing,
      });
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    }
  }, [planting.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function registerExpense(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await api.createExpense({
        ...expense,
        plantingId: planting.id,
        amount: Number(expense.amount),
        observations: expense.observations || null,
      });
      setExpense({ ...emptyExpense, expenseDate: toInputDate() });
      setShowExpenseForm(false);
      await load();
      await onChanged();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function updateClosing(event) {
    event.preventDefault();
    setClosingLoading(true);
    try {
      const closing = await api.getSeasonClosing(planting.id, salePrice);
      setData((current) => ({ ...current, closing }));
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setClosingLoading(false);
    }
  }

  return (
    <Modal
      title={`${planting.crop} — ${planting.harvest}`}
      description={`${formatNumber(planting.plantedAreaHectares)} ha · plantado em ${formatDate(planting.plantingDate)}`}
      onClose={onClose}
    >
      <div className="planting-detail">
        <ErrorBanner message={error} />
        {!data ? (
          <LoadingState label="Carregando o plantio..." />
        ) : (
          <>
            <section>
              <h3>Resumo do plantio</h3>
              <div className="compact-list">
                <div>
                  <span>Área plantada</span>
                  <strong>
                    {formatNumber(planting.plantedAreaHectares)} ha
                  </strong>
                </div>
                <div>
                  <span>Variedade</span>
                  <strong>{planting.seedVariety}</strong>
                </div>
                <div>
                  <span>Data do plantio</span>
                  <strong>{formatDate(planting.plantingDate)}</strong>
                </div>
              </div>
            </section>
            <section>
              <h3>Resumo financeiro</h3>
              <div className="planting-detail__summary">
                <div>
                  <span>Total gasto</span>
                  <strong>{formatCurrency(data.summary.totalExpenses)}</strong>
                </div>
                <div>
                  <span>Custo por hectare</span>
                  <strong>
                    {formatCurrency(data.summary.expensePerHectare)}
                  </strong>
                </div>
                <div>
                  <span>Lançamentos</span>
                  <strong>
                    {data.summary.expenseCount ?? data.expenses.length}
                  </strong>
                </div>
              </div>
            </section>

            <section className="season-closing-panel">
              <div className="section-heading">
                <div>
                  <h3>
                    <BarChart3 size={17} /> Fechamento de safra
                  </h3>
                  <p>
                    Custo total vs. produÃ§Ã£o registrada no diÃ¡rio de
                    colheita.
                  </p>
                </div>
              </div>

              <div className="season-closing-grid">
                <div>
                  <span>Custo total</span>
                  <strong>{formatCurrency(data.closing.totalExpenses)}</strong>
                </div>
                <div>
                  <span>Custo por hectare</span>
                  <strong>
                    {formatCurrency(data.closing.expensePerHectare)}
                  </strong>
                </div>
                <div>
                  <span>ProduÃ§Ã£o registrada</span>
                  <strong>
                    {formatNumber(data.closing.mainHarvestQuantity, 3)}{" "}
                    {data.closing.mainHarvestUnit || "un."}
                  </strong>
                </div>
                <div
                  className={
                    Number(data.closing.estimatedResult || 0) < 0
                      ? "season-closing-result season-closing-result--negative"
                      : "season-closing-result"
                  }
                >
                  <span>Resultado estimado</span>
                  <strong>
                    {data.closing.revenueEstimated
                      ? formatCurrency(data.closing.estimatedResult)
                      : "Informe o preÃ§o"}
                  </strong>
                </div>
              </div>

              <form className="season-price-form" onSubmit={updateClosing}>
                <label>
                  <span>
                    PreÃ§o recebido por {data.closing.mainHarvestUnit || "un."}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Ex.: 70,00"
                    value={salePrice}
                    onChange={(event) => setSalePrice(event.target.value)}
                  />
                </label>
                <button
                  className="button button--primary"
                  disabled={closingLoading}
                >
                  <TrendingUp size={17} />{" "}
                  {closingLoading ? "Calculando..." : "Atualizar resultado"}
                </button>
              </form>

              {data.closing.harvestTotals.length === 0 ? (
                <p className="muted-copy">
                  Ainda nÃ£o hÃ¡ colheita registrada no diÃ¡rio para este
                  plantio.
                </p>
              ) : data.closing.harvestTotals.length > 1 ? (
                <div className="season-harvest-list">
                  {data.closing.harvestTotals.map((item) => (
                    <span key={item.unit || "sem-unidade"}>
                      {formatNumber(item.quantity, 3)} {item.unit || "un."}
                    </span>
                  ))}
                </div>
              ) : null}
            </section>

            <section>
              <div className="section-heading">
                <h3>Gastos do plantio</h3>
                <button
                  className="button button--primary"
                  onClick={() => setShowExpenseForm(!showExpenseForm)}
                >
                  <Plus size={17} /> Registrar gasto
                </button>
              </div>
              {showExpenseForm && (
                <form className="quick-expense-form" onSubmit={registerExpense}>
                  <input
                    required
                    placeholder="Descrição"
                    value={expense.description}
                    onChange={(event) =>
                      setExpense({
                        ...expense,
                        description: event.target.value,
                      })
                    }
                  />
                  <select
                    value={expense.category}
                    onChange={(event) =>
                      setExpense({ ...expense, category: event.target.value })
                    }
                  >
                    <option value="SEEDS">Sementes</option>
                    <option value="FERTILIZERS">Fertilizantes</option>
                    <option value="PESTICIDES">Defensivos</option>
                    <option value="FUEL">Combustível</option>
                    <option value="MAINTENANCE">Manutenção</option>
                    <option value="LABOR">Mão de obra</option>
                    <option value="OTHER">Outros</option>
                  </select>
                  <input
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="Valor em R$"
                    value={expense.amount}
                    onChange={(event) =>
                      setExpense({ ...expense, amount: event.target.value })
                    }
                  />
                  <input
                    required
                    type="date"
                    value={expense.expenseDate}
                    onChange={(event) =>
                      setExpense({
                        ...expense,
                        expenseDate: event.target.value,
                      })
                    }
                  />
                  <button className="button button--primary" disabled={saving}>
                    {saving ? "Salvando..." : "Salvar gasto"}
                  </button>
                </form>
              )}
              {data.expenses.length === 0 ? (
                <p className="muted-copy">
                  Nenhum gasto registrado neste plantio.
                </p>
              ) : (
                <div className="compact-list">
                  {data.expenses.map((item) => (
                    <div key={item.id}>
                      <span>
                        {formatDate(item.expenseDate)} · {item.description}
                      </span>
                      <strong>{formatCurrency(item.amount)}</strong>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <div className="planting-detail__columns">
              <section>
                <h3>
                  <BookOpenText size={17} /> Diário e observações
                </h3>
                {data.diary.slice(0, 4).map((item) => (
                  <p key={item.id}>
                    <strong>{item.activityTypeName}:</strong> {item.activity}
                  </p>
                ))}
                {!data.diary.length && (
                  <p className="muted-copy">Sem lançamentos no diário.</p>
                )}
              </section>
              <section>
                <h3>
                  <CloudRain size={17} /> Chuvas registradas
                </h3>
                {data.rainfall.slice(0, 4).map((item) => (
                  <p key={item.id}>
                    {formatDate(item.measurementDate)} ·{" "}
                    <strong>{item.millimeters} mm</strong>
                  </p>
                ))}
                {!data.rainfall.length && (
                  <p className="muted-copy">Sem chuva vinculada.</p>
                )}
              </section>
            </div>

            <section>
              <h3>Ações rápidas</h3>
              <div className="quick-actions">
                <button
                  className="button button--primary"
                  onClick={() => setShowExpenseForm(true)}
                >
                  <ReceiptText size={18} /> Registrar gasto
                </button>
                <Link
                  className="button button--ghost"
                  to={`/diario?plantingId=${planting.id}&new=rain`}
                >
                  <CloudRain size={18} /> Registrar chuva
                </Link>
                <Link
                  className="button button--ghost"
                  to={`/diario?plantingId=${planting.id}&new=observation`}
                >
                  <BookOpenText size={18} /> Nova observação
                </Link>
                {planting.status === "HARVESTED" ? (
                  <button
                    className="button button--primary"
                    onClick={() => onReactivate(planting)}
                  >
                    <RotateCcw size={18} /> Reativar plantio
                  </button>
                ) : (
                  <button
                    className="button button--ghost"
                    onClick={() => onFinish(planting)}
                  >
                    <CheckCircle2 size={18} /> Finalizar plantio
                  </button>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </Modal>
  );
}
