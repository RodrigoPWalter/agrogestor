import { Archive, PackageCheck, Plus } from "lucide-react";
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
import { ProductFormModal } from "../components/inventory/ProductFormModal";
import { PageHeader } from "../components/PageHeader";
import { toInputDate } from "../utils/formatters";
import { useSingleFlight } from "../hooks/useSingleFlight";
import { useLatestRequestGuard } from "../hooks/useLatestRequestGuard";
import { useOfflineRefresh } from "../hooks/useOfflineRefresh";
import { mutationFeedback } from "../offline/offlineFeedback";
import { isOfflineResult } from "../offline/offlineSync";

const emptyProduct = {
  name: "",
  productType: "SEED",
  initialQuantity: "",
  unit: "KILOGRAM",
  minimumStock: "",
  expirationDate: "",
  newUnitCost: "",
  adjustmentDate: toInputDate(),
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
  const [stockView, setStockView] = useState("available");
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
  const [movementsLoading, setMovementsLoading] = useState(false);
  const [movementsError, setMovementsError] = useState("");
  const [valuationHistory, setValuationHistory] = useState([]);
  const [valuationHistoryLoading, setValuationHistoryLoading] = useState(false);
  const [valuationHistoryError, setValuationHistoryError] = useState("");
  const beginMovementRequest = useLatestRequestGuard();
  const beginValuationRequest = useLatestRequestGuard();

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

  useOfflineRefresh(() => loadProducts({ showLoading: false }));

  const availableProducts = useMemo(
    () => products.filter((product) => Number(product.quantity) > 0),
    [products],
  );
  const outOfStockProducts = useMemo(
    () => products.filter((product) => Number(product.quantity) <= 0),
    [products],
  );
  const visibleProducts =
    stockView === "available" ? availableProducts : outOfStockProducts;
  const summary = useMemo(
    () => ({
      total: availableProducts.length,
      low: availableProducts.filter((product) => product.lowStock).length,
      expired: availableProducts.filter((product) => product.expired).length,
    }),
    [availableProducts],
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
      newUnitCost: product.averageUnitCost || "",
      adjustmentDate: toInputDate(),
    });
    setProductModal(true);
    void loadValuationHistory(product);
  }

  async function loadMovementHistory(product) {
    const isCurrentRequest = beginMovementRequest();
    setMovements([]);
    setMovementsError("");
    setMovementsLoading(true);
    try {
      const items = await api.getInventoryMovements(product.id);
      if (isCurrentRequest()) setMovements(items);
    } catch (requestError) {
      if (isCurrentRequest()) {
        setMovementsError(
          requestError.message || "Não foi possível carregar as movimentações.",
        );
      }
    } finally {
      if (isCurrentRequest()) setMovementsLoading(false);
    }
  }

  function openMovement(product) {
    setSelected(product);
    setMovement({
      movementType: "ENTRY",
      quantity: "",
      movementDate: toInputDate(),
      notes: "",
    });
    setMovementModal(true);
    void loadMovementHistory(product);
  }

  async function loadValuationHistory(product) {
    const isCurrentRequest = beginValuationRequest();
    setValuationHistory([]);
    setValuationHistoryError("");
    setValuationHistoryLoading(true);
    try {
      const items = await api.getInventoryValuationAdjustments(product.id);
      if (isCurrentRequest()) setValuationHistory(items);
    } catch (requestError) {
      if (isCurrentRequest()) {
        setValuationHistoryError(
          requestError.message ||
            "Não foi possível carregar os ajustes anteriores.",
        );
      }
    } finally {
      if (isCurrentRequest()) setValuationHistoryLoading(false);
    }
  }

  function closeMovement() {
    beginMovementRequest();
    setMovementModal(false);
  }

  function closeProduct() {
    beginValuationRequest();
    setProductModal(false);
  }

  async function submitProduct(event) {
    event.preventDefault();
    await runSaving(async () => {
      const productData = {
        name: form.name,
        productType: form.productType,
        unit: form.unit,
        minimumStock: Number(form.minimumStock || 0),
        expirationDate: form.expirationDate || null,
      };
      try {
        let result;
        if (editing) {
          result = await api.updateInventoryProduct(editing.id, {
            ...productData,
            newUnitCost:
              Number(editing.quantity) > 0 ? Number(form.newUnitCost) : null,
            adjustmentDate: form.adjustmentDate,
          });
          setSuccess(
            mutationFeedback(result, "Produto atualizado com sucesso."),
          );
        } else {
          result = await api.createInventoryProduct({
            ...productData,
            initialQuantity: Number(form.initialQuantity || 0),
          });
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
        <>
          <div
            className="inventory-stock-tabs"
            role="tablist"
            aria-label="Situação do estoque"
          >
            <button
              type="button"
              role="tab"
              aria-selected={stockView === "available"}
              className={stockView === "available" ? "is-active" : ""}
              onClick={() => setStockView("available")}
            >
              <PackageCheck size={17} /> Em estoque ({availableProducts.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={stockView === "out"}
              className={stockView === "out" ? "is-active" : ""}
              onClick={() => setStockView("out")}
            >
              <Archive size={17} /> Sem estoque ({outOfStockProducts.length})
            </button>
          </div>

          {visibleProducts.length === 0 ? (
            <EmptyState
              title={
                stockView === "available"
                  ? "Nenhum produto com saldo"
                  : "Nenhum produto sem estoque"
              }
              description={
                stockView === "available"
                  ? "Os produtos zerados continuam guardados na aba Sem estoque para uma futura reposição."
                  : "Quando um produto acabar, ele continuará cadastrado e aparecerá aqui."
              }
            />
          ) : (
            <InventoryProductList
              products={visibleProducts}
              onEdit={openEdit}
              onDelete={removeProduct}
              onMovement={openMovement}
            />
          )}
        </>
      )}

      {productModal && (
        <ProductFormModal
          editing={Boolean(editing)}
          product={editing}
          form={form}
          history={valuationHistory}
          historyLoading={valuationHistoryLoading}
          historyError={valuationHistoryError}
          saving={saving}
          today={toInputDate()}
          onChange={setForm}
          onClose={closeProduct}
          onRetryHistory={() => loadValuationHistory(editing)}
          onSubmit={submitProduct}
        />
      )}

      {movementModal && selected && (
        <InventoryMovementModal
          product={selected}
          movement={movement}
          movements={movements}
          historyLoading={movementsLoading}
          historyError={movementsError}
          saving={saving}
          onChange={setMovement}
          onClose={closeMovement}
          onRetryHistory={() => loadMovementHistory(selected)}
          onSubmit={submitMovement}
        />
      )}
    </div>
  );
}
