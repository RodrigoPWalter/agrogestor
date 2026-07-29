import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";
import { formatDate, formatNumber, toInputDate } from "../utils/formatters";
import { ErrorBanner, LoadingState } from "./Feedback";
import { Modal } from "./Modal";
import { PlantingActivitySections } from "./planting-details/PlantingActivitySections";
import { PlantingExpensesSection } from "./planting-details/PlantingExpensesSection";
import { PlantingOverview } from "./planting-details/PlantingOverview";
import { PlantingQuickActions } from "./planting-details/PlantingQuickActions";
import { SeasonClosingPanel } from "./planting-details/SeasonClosingPanel";

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
            <PlantingOverview
              planting={planting}
              summary={data.summary}
              expenseCount={data.expenses.length}
            />
            <SeasonClosingPanel
              closing={data.closing}
              salePrice={salePrice}
              loading={closingLoading}
              onSalePriceChange={(event) => setSalePrice(event.target.value)}
              onSubmit={updateClosing}
            />
            <PlantingExpensesSection
              expenses={data.expenses}
              expense={expense}
              formOpen={showExpenseForm}
              saving={saving}
              onExpenseChange={setExpense}
              onToggleForm={() => setShowExpenseForm(!showExpenseForm)}
              onSubmit={registerExpense}
            />
            <PlantingActivitySections
              diary={data.diary}
              rainfall={data.rainfall}
            />
            <PlantingQuickActions
              planting={planting}
              onShowExpenseForm={() => setShowExpenseForm(true)}
              onFinish={onFinish}
              onReactivate={onReactivate}
            />
          </>
        )}
      </div>
    </Modal>
  );
}
