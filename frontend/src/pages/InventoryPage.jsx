import { Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import {
  EmptyState,
  ErrorBanner,
  LoadingState,
  SuccessBanner,
} from "../components/Feedback";
import { InventoryMovementModal } from "../components/inventory/InventoryMovementModal";
import { InventoryProductList } from "../components/inventory/InventoryProductList";
import { InventorySummary } from "../components/inventory/InventorySummary";
import { ProductFormModal } from "../components/inventory/ProductFormModal";
import { PageHeader } from "../components/PageHeader";
import { toInputDate } from "../utils/formatters";

const emptyProduct = {
  name: "",
  productType: "SEED",
  initialQuantity: "",
  unit: "KILOGRAM",
  minimumStock: "",
  expirationDate: "",
};

export function InventoryPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [productModal, setProductModal] = useState(false);
  const [movementModal, setMovementModal] = useState(false);
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

  async function loadProducts() {
    setLoading(true);
    try {
      setProducts(await api.getInventoryProducts());
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
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

  async function submitProduct(event) {
    event.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      initialQuantity: Number(form.initialQuantity || 0),
      minimumStock: Number(form.minimumStock || 0),
      expirationDate: form.expirationDate || null,
    };
    try {
      if (editing) {
        await api.updateInventoryProduct(editing.id, payload);
        setSuccess("Produto atualizado com sucesso.");
      } else {
        await api.createInventoryProduct(payload);
        setSuccess("Produto adicionado ao estoque.");
      }
      setProductModal(false);
      await loadProducts();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function submitMovement(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await api.moveInventory(selected.id, {
        ...movement,
        quantity: Number(movement.quantity),
        notes: movement.notes || null,
      });
      setSuccess(
        `${movement.movementType === "ENTRY" ? "Entrada" : "Saída"} registrada.`,
      );
      setMovementModal(false);
      await loadProducts();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function removeProduct(product) {
    if (!window.confirm(`Excluir “${product.name}” e todo o histórico?`))
      return;
    try {
      await api.deleteInventoryProduct(product.id);
      setSuccess("Produto excluído.");
      await loadProducts();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Insumos e defensivos"
        title="Estoque"
        description="Acompanhe saldos, validade e todas as entradas e saídas."
        action={
          <button className="button button--primary" onClick={openCreate}>
            <Plus size={18} /> Novo produto
          </button>
        }
      />
      <ErrorBanner message={error} />
      <SuccessBanner message={success} />

      <InventorySummary summary={summary} />

      {loading ? (
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
    </div>
  );
}
