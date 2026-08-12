import { Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { useConfirmation } from "../components/ConfirmationProvider";
import {
  EmptyState,
  ErrorBanner,
  LoadingState,
  OfflineDataState,
  SuccessBanner,
} from "../components/Feedback";
import { InventoryMovementModal } from "../components/inventory/InventoryMovementModal";
import { InventoryProductList } from "../components/inventory/InventoryProductList";
import { InventorySummary } from "../components/inventory/InventorySummary";
import { InventoryValuationModal } from "../components/inventory/InventoryValuationModal";
import { ProductFormModal } from "../components/inventory/ProductFormModal";
import { PageHeader } from "../components/PageHeader";
import { toInputDate } from "../utils/formatters";
import { useSingleFlight } from "../hooks/useSingleFlight";
import { mutationFeedback } from "../offline/offlineFeedback";
import { isOfflineResult } from "../offline/offlineSync";

const emptyProduct = {
  name: "",
  productType: "SEED",
  initialQuantity: "",
  unit: "KILOGRAM",
  minimumStock: "",
  expirationDate: "",
};

export function InventoryPage() {
  const requestConfirmation = useConfirmation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [offlineDataUnavailable, setOfflineDataUnavailable] = useState(false);
  const { pending: saving, run: runSaving } = useSingleFlight();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [productModal, setProductModal] = useState(false);
  const [movementModal, setMovementModal] = useState(false);
  const [valuationModal, setValuationModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyProduct);
  const [movement, setMovement] = useState({
    movementType: "ENTRY",
    quantity: "",
    movementDate: toInputDate(),
    notes: "",
  });
  const [movements, setMovements] = useState([]);
  const [valuationHistory, setValuationHistory] = useState([]);
  const [valuation, setValuation] = useState({
    adjustmentDate: toInputDate(),
    newUnitCost: "",
    reason: "",
  });

  async function loadProducts({ showLoading = true } = {}) {
    if (showLoading) setLoading(true);
    try {
      setProducts(await api.getInventoryProducts());
      setOfflineDataUnavailable(false);
      setError("");
    } catch (requestError) {
      setOfflineDataUnavailable(Boolean(requestError.offlineCacheMiss));
      setError(requestError.offlineCacheMiss ? "" : requestError.message);
    } finally {
      if (showLoading) setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  const summary = useMemo(
    () => ({
      total: products.length,
      low: products.filter((product) => product.lowStock).length,
      expired: products.filter((product) => product.expired).length,
    }),
    [products],
  );

  function openCreate() {
    setEditing(null);
    setForm(emptyProduct);
    setProductModal(true);
  }

  function openEdit(product) {
    setEditing(product);
    setForm({
      name: product.name,
      productType: product.productType,
      initialQuantity: product.quantity,
      unit: product.unit,
      minimumStock: product.minimumStock,
      expirationDate: product.expirationDate || "",
    });
    setProductModal(true);
  }

  async function openMovement(product) {
    setSelected(product);
    setMovement({
      movementType: "ENTRY",
      quantity: "",
      movementDate: toInputDate(),
      notes: "",
    });
    setMovementModal(true);
    try {
      setMovements(await api.getInventoryMovements(product.id));
    } catch {
      setMovements([]);
    }
  }

  async function openValuation(product) {
    setSelected(product);
    setValuation({
      adjustmentDate: toInputDate(),
      newUnitCost: product.averageUnitCost || "",
      reason: "",
    });
    setValuationModal(true);
    try {
      setValuationHistory(
        await api.getInventoryValuationAdjustments(product.id),
      );
    } catch {
      setValuationHistory([]);
    }
  }

  async function submitProduct(event) {
    event.preventDefault();
    await runSaving(async () => {
      const payload = {
        ...form,
        initialQuantity: Number(form.initialQuantity || 0),
        minimumStock: Number(form.minimumStock || 0),
        expirationDate: form.expirationDate || null,
      };
      try {
        let result;
        if (editing) {
          result = await api.updateInventoryProduct(editing.id, payload);
          setSuccess(
            mutationFeedback(result, "Produto atualizado com sucesso."),
          );
        } else {
          result = await api.createInventoryProduct(payload);
          setSuccess(
            mutationFeedback(result, "Produto adicionado ao estoque."),
          );
        }
        setProductModal(false);
        if (isOfflineResult(result)) return;
        await loadProducts({ showLoading: false });
      } catch (requestError) {
        setError(requestError.message);
      }
    });
  }

  async function submitMovement(event) {
    event.preventDefault();
    await runSaving(async () => {
      try {
        const result = await api.moveInventory(selected.id, {
          ...movement,
          quantity: Number(movement.quantity),
          notes: movement.notes || null,
        });
        setSuccess(
          mutationFeedback(
            result,
            `${movement.movementType === "ENTRY" ? "Entrada" : "Saída"} registrada.`,
          ),
        );
        setMovementModal(false);
        if (isOfflineResult(result)) return;
        await loadProducts({ showLoading: false });
      } catch (requestError) {
        setError(requestError.message);
      }
    });
  }

  async function submitValuation(event) {
    event.preventDefault();
    await runSaving(async () => {
      try {
        const result = await api.adjustInventoryValuation(selected.id, {
          adjustmentDate: valuation.adjustmentDate,
          newUnitCost: Number(valuation.newUnitCost),
          reason: valuation.reason,
        });
        setSuccess(
          mutationFeedback(result, "Custo atual do estoque ajustado."),
        );
        setValuationModal(false);
        if (isOfflineResult(result)) return;
        await loadProducts({ showLoading: false });
      } catch (requestError) {
        setError(requestError.message);
      }
    });
  }

  async function removeProduct(product) {
    const confirmed = await requestConfirmation({
      title: "Excluir produto?",
      description: `“${product.name}” e todo o seu histórico de movimentações serão excluídos.`,
      detail: "Esta ação não pode ser desfeita.",
      confirmLabel: "Excluir produto",
    });
    if (!confirmed) return;
    try {
      const result = await api.deleteInventoryProduct(product.id);
      setSuccess(mutationFeedback(result, "Produto excluído."));
      if (isOfflineResult(result)) return;
      await loadProducts({ showLoading: false });
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Insumos e defensivos"
        title="Estoque"
        description="Acompanhe saldos, custos, validade e todas as entradas e saídas."
        action={
          <button className="button button--primary" onClick={openCreate}>
            <Plus size={18} /> Novo produto
          </button>
        }
      />
      <ErrorBanner message={error} onDismiss={() => setError("")} />
      <SuccessBanner message={success} onDismiss={() => setSuccess("")} />

      {!offlineDataUnavailable && <InventorySummary summary={summary} />}

      {offlineDataUnavailable ? (
        <OfflineDataState onRetry={() => loadProducts()} />
      ) : loading ? (
        <LoadingState label="Conferindo o estoque..." />
      ) : products.length === 0 ? (
        <EmptyState
          title="Estoque vazio"
          description="Cadastre sementes, fertilizantes e defensivos."
          action={
            <button className="button button--primary" onClick={openCreate}>
              <Plus size={18} /> Cadastrar produto
            </button>
          }
        />
      ) : (
        <InventoryProductList
          products={products}
          onEdit={openEdit}
          onDelete={removeProduct}
          onMovement={openMovement}
          onValuation={openValuation}
        />
      )}

      {productModal && (
        <ProductFormModal
          editing={Boolean(editing)}
          form={form}
          saving={saving}
          onChange={setForm}
          onClose={() => setProductModal(false)}
          onSubmit={submitProduct}
        />
      )}

      {movementModal && selected && (
        <InventoryMovementModal
          product={selected}
          movement={movement}
          movements={movements}
          saving={saving}
          onChange={setMovement}
          onClose={() => setMovementModal(false)}
          onSubmit={submitMovement}
        />
      )}

      {valuationModal && selected && (
        <InventoryValuationModal
          product={selected}
          form={valuation}
          history={valuationHistory}
          saving={saving}
          today={toInputDate()}
          onChange={setValuation}
          onClose={() => setValuationModal(false)}
          onSubmit={submitValuation}
        />
      )}
    </div>
  );
}
