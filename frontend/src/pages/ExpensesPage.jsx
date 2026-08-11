import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { useConfirmation } from "../components/ConfirmationProvider";
import { ExpenseCategoryBreakdown } from "../components/expenses/ExpenseCategoryBreakdown";
import { ExpenseFormModal } from "../components/expenses/ExpenseFormModal";
import { ExpenseSummary } from "../components/expenses/ExpenseSummary";
import { ExpenseTable } from "../components/expenses/ExpenseTable";
import { ExpensesHeader } from "../components/expenses/ExpensesHeader";
import {
  EmptyState,
  ErrorBanner,
  LoadingState,
  OfflineDataState,
  SuccessBanner,
} from "../components/Feedback";
import { useLatestRequestGuard } from "../hooks/useLatestRequestGuard";
import { useSingleFlight } from "../hooks/useSingleFlight";
import { mutationFeedback } from "../offline/offlineFeedback";
import { isOfflineResult } from "../offline/offlineSync";
import {
  clearFormDraft,
  readFormDraft,
  writeFormDraft,
} from "../utils/formDraft";
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

function expenseDraftKey(scope) {
  return scope === "property" ? "gasto-propriedade" : "gasto-plantio";
}

export function ExpensesPage() {
  const requestConfirmation = useConfirmation();
  const [scope, setScope] = useState("planting");
  const [plantings, setPlantings] = useState([]);
  const [selectedPlantingId, setSelectedPlantingId] = useState("");
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [offlineDataUnavailable, setOfflineDataUnavailable] = useState(false);
  const { pending: saving, run: runSaving } = useSingleFlight();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(newExpenseForm());
  const [searchQuery, setSearchQuery] = useState("");
  const [draftRecovered, setDraftRecovered] = useState(false);
  const beginExpenseRequest = useLatestRequestGuard();

  useEffect(() => {
    api
      .getAllPlantings()
      .then((page) => {
        setPlantings(page.content);
        if (page.content.length > 0) {
          setSelectedPlantingId(page.content[0].id);
        } else {
          setScope("property");
        }
      })
      .catch((requestError) => {
        setError(requestError.message);
        setScope("property");
      });
  }, []);

  const loadExpenseData = useCallback(
    async (targetScope, plantingId, { showLoading = true } = {}) => {
      if (targetScope === "planting" && !plantingId) {
        setExpenses([]);
        setSummary(null);
        setLoading(false);
        return;
      }

      const isCurrentRequest = beginExpenseRequest();
      if (showLoading) setLoading(true);
      try {
        const requests =
          targetScope === "property"
            ? [api.getPropertyExpenses(), api.getPropertyExpenseSummary()]
            : [api.getExpenses(plantingId), api.getExpenseSummary(plantingId)];
        const [expensePage, expenseSummary] = await Promise.all(requests);
        if (isCurrentRequest()) {
          setExpenses(expensePage.content);
          setSummary(expenseSummary);
          setOfflineDataUnavailable(false);
          setError("");
        }
      } catch (requestError) {
        if (isCurrentRequest()) {
          setOfflineDataUnavailable(Boolean(requestError.offlineCacheMiss));
          setError(requestError.offlineCacheMiss ? "" : requestError.message);
        }
      } finally {
        if (showLoading && isCurrentRequest()) setLoading(false);
      }
    },
    [beginExpenseRequest],
  );

  useEffect(() => {
    loadExpenseData(scope, selectedPlantingId);
  }, [scope, selectedPlantingId, loadExpenseData]);

  useEffect(() => {
    if (modalOpen && !editing) {
      writeFormDraft(expenseDraftKey(scope), form);
    }
  }, [editing, form, modalOpen, scope]);

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

  function changeScope(nextScope) {
    setScope(nextScope);
    setSearchQuery("");
    setError("");
  }

  function openCreate() {
    const draft = readFormDraft(expenseDraftKey(scope));
    const plantingId = scope === "property" ? "" : selectedPlantingId;
    setEditing(null);
    setForm({ ...newExpenseForm(plantingId), ...draft, plantingId });
    setDraftRecovered(Boolean(draft));
    setModalOpen(true);
    setError("");
  }

  function openEdit(expense) {
    setDraftRecovered(false);
    setEditing(expense);
    setForm({
      plantingId: expense.plantingId || "",
      description: expense.description,
      category: expense.category,
      amount: expense.amount,
      expenseDate: expense.expenseDate,
      observations: expense.observations || "",
    });
    setModalOpen(true);
    setError("");
  }

  function closeForm() {
    if (!editing) clearFormDraft(expenseDraftKey(scope));
    setDraftRecovered(false);
    setModalOpen(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await runSaving(async () => {
      setError("");
      const payload = {
        ...form,
        plantingId: scope === "property" ? null : form.plantingId || null,
        amount: Number(form.amount),
        observations: form.observations || null,
      };
      try {
        if (editing) {
          const result = await api.updateExpense(editing.id, payload);
          setSuccess(mutationFeedback(result, "Gasto atualizado com sucesso."));
          if (isOfflineResult(result)) {
            setModalOpen(false);
            return;
          }
        } else {
          const result = await api.createExpense(payload);
          clearFormDraft(expenseDraftKey(scope));
          setDraftRecovered(false);
          setSuccess(
            mutationFeedback(
              result,
              scope === "property"
                ? "Gasto da propriedade registrado com sucesso."
                : "Gasto registrado com sucesso.",
            ),
          );
          if (isOfflineResult(result)) {
            setModalOpen(false);
            return;
          }
        }
        setModalOpen(false);
        if (scope === "planting" && form.plantingId !== selectedPlantingId) {
          setSelectedPlantingId(form.plantingId);
        } else {
          await loadExpenseData(scope, selectedPlantingId, {
            showLoading: false,
          });
        }
      } catch (requestError) {
        setError(requestError.message);
      }
    });
  }

  async function handleDelete(expense) {
    const location = scope === "property" ? "da propriedade" : "do plantio";
    const confirmed = await requestConfirmation({
      title: "Excluir gasto?",
      description: `O lançamento “${expense.description}” será removido ${location}.`,
      confirmLabel: "Excluir gasto",
    });
    if (!confirmed) return;
    setError("");
    try {
      const result = await api.deleteExpense(expense.id);
      setSuccess(mutationFeedback(result, "Gasto excluído."));
      if (isOfflineResult(result)) return;
      await loadExpenseData(scope, selectedPlantingId, {
        showLoading: false,
      });
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  const noPlantings = scope === "planting" && plantings.length === 0;

  return (
    <div className="page">
      <ExpensesHeader
        plantings={plantings}
        scope={scope}
        selectedPlantingId={selectedPlantingId}
        onScopeChange={changeScope}
        onPlantingChange={(event) => {
          setSelectedPlantingId(event.target.value);
          setSearchQuery("");
        }}
      />

      <ErrorBanner message={error} onDismiss={() => setError("")} />
      <SuccessBanner message={success} onDismiss={() => setSuccess("")} />

      {offlineDataUnavailable ? (
        <OfflineDataState
          onRetry={() => loadExpenseData(scope, selectedPlantingId)}
        />
      ) : noPlantings && !loading ? (
        <EmptyState
          title="Nenhum plantio cadastrado"
          description="Cadastre uma safra ou use a aba Da propriedade para registrar despesas gerais."
          action={
            <Link className="button button--primary" to="/plantios">
              Ir para plantios
            </Link>
          }
        />
      ) : loading ? (
        <LoadingState label="Calculando os gastos..." />
      ) : (
        <>
          <ExpenseSummary
            summary={summary}
            expenseCount={expenses.length}
            scope={scope}
          />

          <div className="expenses-layout">
            <ExpenseTable
              expenses={expenses}
              filteredExpenses={filteredExpenses}
              searchQuery={searchQuery}
              canCreate={scope === "property" || Boolean(selectedPlantingId)}
              scope={scope}
              onSearchChange={(event) => setSearchQuery(event.target.value)}
              onCreate={openCreate}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
            <ExpenseCategoryBreakdown categories={summary?.categories} />
          </div>
        </>
      )}

      {modalOpen && (
        <ExpenseFormModal
          editing={Boolean(editing)}
          form={form}
          plantings={plantings}
          scope={scope}
          saving={saving}
          draftRecovered={draftRecovered}
          onChange={setForm}
          onClose={closeForm}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
