import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { ExpenseCategoryBreakdown } from "../components/expenses/ExpenseCategoryBreakdown";
import { ExpenseFormModal } from "../components/expenses/ExpenseFormModal";
import { ExpenseSummary } from "../components/expenses/ExpenseSummary";
import { ExpenseTable } from "../components/expenses/ExpenseTable";
import { ExpensesHeader } from "../components/expenses/ExpensesHeader";
import {
  EmptyState,
  ErrorBanner,
  LoadingState,
  SuccessBanner,
} from "../components/Feedback";
import { toInputDate } from "../utils/formatters";

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
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    api
      .getAllPlantings()
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

  const loadExpenseData = useCallback(
    async (plantingId, { showLoading = true } = {}) => {
      if (!plantingId) return;
      if (showLoading) setLoading(true);
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
        if (showLoading) setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadExpenseData(selectedPlantingId);
  }, [selectedPlantingId, loadExpenseData]);

  const filteredExpenses = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase("pt-BR");
    if (!query) return expenses;
    return expenses.filter((expense) =>
      [
        expense.description,
        expense.categoryDisplayName,
        expense.expenseDate,
      ].some((value) =>
        String(value || "")
          .toLocaleLowerCase("pt-BR")
          .includes(query),
      ),
    );
  }, [expenses, searchQuery]);

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
        await loadExpenseData(selectedPlantingId, { showLoading: false });
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
      await loadExpenseData(selectedPlantingId, { showLoading: false });
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <div className="page">
      <ExpensesHeader
        plantings={plantings}
        selectedPlantingId={selectedPlantingId}
        onPlantingChange={(event) => {
          setSelectedPlantingId(event.target.value);
          setSearchQuery("");
        }}
      />

      <ErrorBanner message={error} onDismiss={() => setError("")} />
      <SuccessBanner message={success} onDismiss={() => setSuccess("")} />

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
          {loading ? (
            <LoadingState label="Calculando os gastos..." />
          ) : (
            <>
              <ExpenseSummary
                summary={summary}
                expenseCount={expenses.length}
              />

              <div className="expenses-layout">
                <ExpenseTable
                  expenses={expenses}
                  filteredExpenses={filteredExpenses}
                  searchQuery={searchQuery}
                  selectedPlantingId={selectedPlantingId}
                  onSearchChange={(event) => setSearchQuery(event.target.value)}
                  onCreate={openCreate}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                />
                <ExpenseCategoryBreakdown categories={summary?.categories} />
              </div>
            </>
          )}
        </>
      )}

      {modalOpen && (
        <ExpenseFormModal
          editing={Boolean(editing)}
          form={form}
          plantings={plantings}
          saving={saving}
          onChange={setForm}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
