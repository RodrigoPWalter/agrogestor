import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Edit3,
  PackagePlus,
  Plus,
  Trash2,
  Warehouse,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import {
  EmptyState,
  ErrorBanner,
  LoadingState,
  SuccessBanner,
} from "../components/Feedback";
import { Modal } from "../components/Modal";
import { PageHeader } from "../components/PageHeader";
import { formatDate, formatNumber, toInputDate } from "../utils/formatters";

const productTypes = [
  { value: "SEED", label: "Semente" },
  { value: "FERTILIZER", label: "Fertilizante" },
  { value: "PESTICIDE", label: "Defensivo" },
];
const units = [
  { value: "LITER", label: "Litros (L)" },
  { value: "KILOGRAM", label: "Quilogramas (Kg)" },
  { value: "UNIT", label: "Unidades" },
];

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

      <section className="module-summary-grid">
        <article>
          <span>
            <Warehouse />
          </span>
          <div>
            <small>Produtos cadastrados</small>
            <strong>{summary.total}</strong>
          </div>
        </article>
        <article className={summary.low ? "summary-warning" : ""}>
          <span>
            <AlertTriangle />
          </span>
          <div>
            <small>Estoque baixo</small>
            <strong>{summary.low}</strong>
          </div>
        </article>
        <article className={summary.expired ? "summary-danger" : ""}>
          <span>
            <PackagePlus />
          </span>
          <div>
            <small>Validade vencida</small>
            <strong>{summary.expired}</strong>
          </div>
        </article>
      </section>

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
        <section className="data-card-grid">
          {products.map((product) => (
            <article
              className={`data-card inventory-card ${product.lowStock ? "inventory-card--low" : ""}`}
              key={product.id}
            >
              <div className="data-card__header">
                <span className="crop-avatar">
                  {product.productTypeName.slice(0, 2).toUpperCase()}
                </span>
                <div>
                  <h2>{product.name}</h2>
                  <span className="badge">{product.productTypeName}</span>
                </div>
                <div className="card-actions">
                  <button
                    className="icon-button"
                    onClick={() => openEdit(product)}
                    aria-label="Editar produto"
                  >
                    <Edit3 size={17} />
                  </button>
                  <button
                    className="icon-button icon-button--danger"
                    onClick={() => removeProduct(product)}
                    aria-label="Excluir produto"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
              <div className="data-card__metric">
                <strong>
                  {formatNumber(product.quantity, 3)} {product.unitName}
                </strong>
                <span>Saldo disponível</span>
              </div>
              <dl className="details-list">
                <div>
                  <dt>Estoque mínimo</dt>
                  <dd>
                    {formatNumber(product.minimumStock, 3)} {product.unitName}
                  </dd>
                </div>
                <div>
                  <dt>Validade</dt>
                  <dd>
                    {product.expirationDate
                      ? formatDate(product.expirationDate)
                      : "Não informada"}
                  </dd>
                </div>
              </dl>
              {(product.lowStock || product.expired) && (
                <p className="card-alert">
                  <AlertTriangle size={15} />{" "}
                  {product.expired
                    ? "Produto vencido"
                    : "Estoque abaixo do mínimo"}
                </p>
              )}
              <button
                className="button button--ghost button--wide"
                onClick={() => openMovement(product)}
              >
                <ArrowDownToLine size={17} /> Movimentar estoque
              </button>
            </article>
          ))}
        </section>
      )}

      {productModal && (
        <Modal
          title={editing ? "Editar produto" : "Novo produto"}
          description="Informe os dados de controle do insumo."
          onClose={() => setProductModal(false)}
        >
          <form className="form" onSubmit={submitProduct}>
            <div className="form-grid">
              <label className="form-grid__full">
                <span>Nome do produto</span>
                <input
                  required
                  maxLength="140"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex.: Herbicida glifosato"
                />
              </label>
              <label>
                <span>Tipo</span>
                <select
                  value={form.productType}
                  onChange={(e) =>
                    setForm({ ...form, productType: e.target.value })
                  }
                >
                  {productTypes.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Unidade</span>
                <select
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                >
                  {units.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>{editing ? "Saldo atual" : "Quantidade inicial"}</span>
                <input
                  required
                  disabled={Boolean(editing)}
                  type="number"
                  min="0"
                  step="0.001"
                  value={form.initialQuantity}
                  onChange={(e) =>
                    setForm({ ...form, initialQuantity: e.target.value })
                  }
                />
              </label>
              <label>
                <span>Alerta abaixo de</span>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.001"
                  value={form.minimumStock}
                  onChange={(e) =>
                    setForm({ ...form, minimumStock: e.target.value })
                  }
                />
              </label>
              <label>
                <span>
                  Data de validade <small>(opcional)</small>
                </span>
                <input
                  type="date"
                  value={form.expirationDate}
                  onChange={(e) =>
                    setForm({ ...form, expirationDate: e.target.value })
                  }
                />
              </label>
            </div>
            <div className="form-actions">
              <button
                type="button"
                className="button button--ghost"
                onClick={() => setProductModal(false)}
              >
                Cancelar
              </button>
              <button className="button button--primary" disabled={saving}>
                {saving ? "Salvando..." : "Salvar produto"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {movementModal && (
        <Modal
          title={`Movimentar ${selected.name}`}
          description={`Saldo atual: ${formatNumber(selected.quantity, 3)} ${selected.unitName}`}
          onClose={() => setMovementModal(false)}
        >
          <form className="form" onSubmit={submitMovement}>
            <div className="segmented-control inventory-movement-type">
              <label
                className={
                  movement.movementType === "ENTRY" ? "is-selected" : ""
                }
              >
                <input
                  type="radio"
                  checked={movement.movementType === "ENTRY"}
                  onChange={() =>
                    setMovement({ ...movement, movementType: "ENTRY" })
                  }
                />
                <ArrowDownToLine size={17} /> Entrada
              </label>
              <label
                className={
                  movement.movementType === "EXIT" ? "is-selected" : ""
                }
              >
                <input
                  type="radio"
                  checked={movement.movementType === "EXIT"}
                  onChange={() =>
                    setMovement({ ...movement, movementType: "EXIT" })
                  }
                />
                <ArrowUpFromLine size={17} /> Saída
              </label>
            </div>
            <div className="form-grid">
              <label>
                <span>Quantidade ({selected.unitName})</span>
                <input
                  required
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={movement.quantity}
                  onChange={(e) =>
                    setMovement({ ...movement, quantity: e.target.value })
                  }
                />
              </label>
              <label>
                <span>Data</span>
                <input
                  required
                  type="date"
                  value={movement.movementDate}
                  onChange={(e) =>
                    setMovement({ ...movement, movementDate: e.target.value })
                  }
                />
              </label>
              <label className="form-grid__full">
                <span>
                  Observação <small>(opcional)</small>
                </span>
                <input
                  maxLength="500"
                  value={movement.notes}
                  onChange={(e) =>
                    setMovement({ ...movement, notes: e.target.value })
                  }
                  placeholder="Ex.: Aplicação no talhão norte"
                />
              </label>
            </div>
            {movements.length > 0 && (
              <div className="mini-history">
                <strong>Movimentações recentes</strong>
                {movements.slice(0, 4).map((item) => (
                  <div key={item.id}>
                    <span>
                      {item.movementTypeName} · {formatDate(item.movementDate)}
                    </span>
                    <b>
                      {formatNumber(item.quantity, 3)} {selected.unitName}
                    </b>
                  </div>
                ))}
              </div>
            )}
            <div className="form-actions">
              <button
                type="button"
                className="button button--ghost"
                onClick={() => setMovementModal(false)}
              >
                Cancelar
              </button>
              <button className="button button--primary" disabled={saving}>
                Registrar{" "}
                {movement.movementType === "ENTRY" ? "entrada" : "saída"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
