import {
  CircleDollarSign,
  Edit3,
  LandPlot,
  Plus,
  ReceiptText,
  Tags,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import {
  EmptyState,
  ErrorBanner,
  LoadingState,
  SuccessBanner,
} from "../components/Feedback";
import { Modal } from "../components/Modal";
import { PageHeader } from "../components/PageHeader";
import {
  formatCurrency,
  formatDate,
  formatNumber,
  toInputDate,
} from "../utils/formatters";

const categories = [
  { value: "SEEDS", label: "Sementes" },
  { value: "FERTILIZERS", label: "Fertilizantes" },
  { value: "PESTICIDES", label: "Defensivos" },
  { value: "FUEL", label: "Combustível" },
  { value: "MAINTENANCE", label: "Manutenção" },
  { value: "LABOR", label: "Mão de obra" },
  { value: "OTHER", label: "Outros" },
];

function newExpenseForm(plantingId = "") {
  return {
    plantingId,
    description: "",
    category: "FERTILIZERS",
    amount: "",
    expenseDate: toInputDate(),
    observations: "",
  };
}

export function ExpensesPage() {
  const [plantings, setPlantings] = useState([]);
  const [selectedPlantingId, setSelectedPlantingId] = useState("");
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(newExpenseForm());

  useEffect(() => {
    api
      .getPlantings()
      .then((page) => {
        setPlantings(page.content);
        if (page.content.length > 0) {
          setSelectedPlantingId(page.content[0].id);
        } else {
          setLoading(false);
        }
      })
      .catch((requestError) => {
        setError(requestError.message);
        setLoading(false);
      });
  }, []);

  const loadExpenseData = useCallback(async (plantingId) => {
    if (!plantingId) return;
    setLoading(true);
    try {
      const [expensePage, expenseSummary] = await Promise.all([
        api.getExpenses(plantingId),
        api.getExpenseSummary(plantingId),
      ]);
      setExpenses(expensePage.content);
      setSummary(expenseSummary);
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExpenseData(selectedPlantingId);
  }, [selectedPlantingId, loadExpenseData]);

  function openCreate() {
    setEditing(null);
    setForm(newExpenseForm(selectedPlantingId));
    setModalOpen(true);
    setError("");
  }

  function openEdit(expense) {
    setEditing(expense);
    setForm({
      plantingId: expense.plantingId,
      description: expense.description,
      category: expense.category,
      amount: expense.amount,
      expenseDate: expense.expenseDate,
      observations: expense.observations || "",
    });
    setModalOpen(true);
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      ...form,
      amount: Number(form.amount),
      observations: form.observations || null,
    };
    try {
      if (editing) {
        await api.updateExpense(editing.id, payload);
        setSuccess("Gasto atualizado com sucesso.");
      } else {
        await api.createExpense(payload);
        setSuccess("Gasto registrado com sucesso.");
      }
      setModalOpen(false);
      if (form.plantingId !== selectedPlantingId) {
        setSelectedPlantingId(form.plantingId);
      } else {
        await loadExpenseData(selectedPlantingId);
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(expense) {
    if (!window.confirm(`Excluir o gasto “${expense.description}”?`)) return;
    setError("");
    try {
      await api.deleteExpense(expense.id);
      setSuccess("Gasto excluído.");
      await loadExpenseData(selectedPlantingId);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Controle financeiro"
        title="Gastos por plantio"
        description="Saiba para onde o dinheiro está indo e quanto custa cada hectare."
        action={
          <button
            className="button button--primary"
            onClick={openCreate}
            disabled={!selectedPlantingId}
          >
            <Plus size={18} /> Registrar gasto
          </button>
        }
      />

      <ErrorBanner message={error} />
      <SuccessBanner message={success} />

      {plantings.length === 0 && !loading ? (
        <EmptyState
          title="Cadastre um plantio primeiro"
          description="Todo gasto precisa estar ligado a uma cultura e safra."
          action={
            <Link className="button button--primary" to="/plantios">
              Ir para plantios
            </Link>
          }
        />
      ) : (
        <>
          <section className="planting-selector">
            <div>
              <span className="eyebrow">Plantio selecionado</span>
              <label>
                <span className="sr-only">Escolher plantio</span>
                <select
                  value={selectedPlantingId}
                  onChange={(event) =>
                    setSelectedPlantingId(event.target.value)
                  }
                >
                  {plantings.map((planting) => (
                    <option key={planting.id} value={planting.id}>
                      {planting.crop} — {planting.harvest} (
                      {formatNumber(planting.plantedAreaHectares)} ha)
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <span className="planting-selector__icon">
              <LandPlot size={25} />
            </span>
          </section>

          {loading ? (
            <LoadingState label="Calculando os gastos..." />
          ) : (
            <>
              <section className="expense-summary-grid">
                <article>
                  <span>
                    <CircleDollarSign size={21} />
                  </span>
                  <div>
                    <small>Total registrado</small>
                    <strong>{formatCurrency(summary?.totalExpenses)}</strong>
                  </div>
                </article>
                <article>
                  <span>
                    <LandPlot size={21} />
                  </span>
                  <div>
                    <small>Custo por hectare</small>
                    <strong>
                      {formatCurrency(summary?.expensePerHectare)}
                    </strong>
                  </div>
                </article>
                <article>
                  <span>
                    <ReceiptText size={21} />
                  </span>
                  <div>
                    <small>Lançamentos</small>
                    <strong>{expenses.length}</strong>
                  </div>
                </article>
                <article>
                  <span>
                    <Tags size={21} />
                  </span>
                  <div>
                    <small>Categorias usadas</small>
                    <strong>{summary?.categories?.length || 0}</strong>
                  </div>
                </article>
              </section>

              <div className="expenses-layout">
                <section className="panel">
                  <div className="panel__header">
                    <div>
                      <span className="eyebrow">Histórico</span>
                      <h2>Gastos registrados</h2>
                    </div>
                    <span className="record-count">
                      {expenses.length} itens
                    </span>
                  </div>

                  {expenses.length === 0 ? (
                    <EmptyState
                      title="Nenhum gasto neste plantio"
                      description="Registre a primeira despesa para começar o controle."
                      action={
                        <button
                          className="button button--primary"
                          onClick={openCreate}
                        >
                          <Plus size={18} /> Registrar gasto
                        </button>
                      }
                    />
                  ) : (
                    <div className="expense-list">
                      {expenses.map((expense) => (
                        <article key={expense.id} className="expense-item">
                          <span className="expense-item__icon">
                            <ReceiptText size={19} />
                          </span>
                          <div className="expense-item__main">
                            <strong>{expense.description}</strong>
                            <small>
                              {expense.categoryDisplayName} ·{" "}
                              {formatDate(expense.expenseDate)}
                            </small>
                          </div>
                          <strong className="expense-item__amount">
                            {formatCurrency(expense.amount)}
                          </strong>
                          <div className="card-actions">
                            <button
                              className="icon-button"
                              onClick={() => openEdit(expense)}
                              aria-label="Editar gasto"
                            >
                              <Edit3 size={17} />
                            </button>
                            <button
                              className="icon-button icon-button--danger"
                              onClick={() => handleDelete(expense)}
                              aria-label="Excluir gasto"
                            >
                              <Trash2 size={17} />
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>

                <section className="panel">
                  <div className="panel__header">
                    <div>
                      <span className="eyebrow">Distribuição</span>
                      <h2>Gastos por categoria</h2>
                    </div>
                  </div>
                  {!summary?.categories?.length ? (
                    <div className="compact-empty">
                      <Tags size={28} />
                      <p>As categorias aparecerão aqui.</p>
                    </div>
                  ) : (
                    <div className="category-breakdown">
                      {summary.categories.map((category) => (
                        <article key={category.category}>
                          <div className="category-breakdown__row">
                            <div>
                              <strong>{category.categoryDisplayName}</strong>
                              <small>{formatCurrency(category.total)}</small>
                            </div>
                            <span>{formatNumber(category.percentage)}%</span>
                          </div>
                          <div className="progress-track">
                            <span
                              style={{ width: `${category.percentage}%` }}
                            />
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </>
          )}
        </>
      )}

      {modalOpen && (
        <Modal
          title={editing ? "Editar gasto" : "Registrar gasto"}
          description="Informe o valor e a categoria para manter o custo atualizado."
          onClose={() => setModalOpen(false)}
        >
          <form className="form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <label className="form-grid__full">
                <span>Plantio relacionado</span>
                <select
                  required
                  value={form.plantingId}
                  onChange={(event) =>
                    setForm({ ...form, plantingId: event.target.value })
                  }
                >
                  {plantings.map((planting) => (
                    <option key={planting.id} value={planting.id}>
                      {planting.crop} — {planting.harvest}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-grid__full">
                <span>Descrição</span>
                <input
                  required
                  maxLength="160"
                  value={form.description}
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                  placeholder="Ex.: Adubo de base"
                />
              </label>
              <label>
                <span>Categoria</span>
                <select
                  required
                  value={form.category}
                  onChange={(event) =>
                    setForm({ ...form, category: event.target.value })
                  }
                >
                  {categories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Valor (R$)</span>
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.amount}
                  onChange={(event) =>
                    setForm({ ...form, amount: event.target.value })
                  }
                  placeholder="2.500,00"
                />
              </label>
              <label>
                <span>Data do gasto</span>
                <input
                  required
                  type="date"
                  value={form.expenseDate}
                  onChange={(event) =>
                    setForm({ ...form, expenseDate: event.target.value })
                  }
                />
              </label>
              <label>
                <span>
                  Observações <small>(opcional)</small>
                </span>
                <input
                  maxLength="1000"
                  value={form.observations}
                  onChange={(event) =>
                    setForm({ ...form, observations: event.target.value })
                  }
                  placeholder="Ex.: Compra à vista"
                />
              </label>
            </div>
            <div className="form-actions">
              <button
                type="button"
                className="button button--ghost"
                onClick={() => setModalOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="button button--primary"
                disabled={saving}
              >
                {saving
                  ? "Salvando..."
                  : editing
                    ? "Salvar alterações"
                    : "Registrar gasto"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
