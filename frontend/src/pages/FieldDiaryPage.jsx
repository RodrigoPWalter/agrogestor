import {
  BookOpenText,
  CloudSun,
  Edit3,
  FlaskConical,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import {
  EmptyState,
  ErrorBanner,
  LoadingState,
  SuccessBanner,
} from "../components/Feedback";
import { Modal } from "../components/Modal";
import { PageHeader } from "../components/PageHeader";
import { DynamicDiaryFields } from "../components/DynamicDiaryFields";
import { formatDate, toInputDate } from "../utils/formatters";

const activityTypes = [
  { value: "INSPECTION", label: "Vistoria" },
  { value: "RAIN", label: "Chuva" },
  { value: "PRODUCT_PURCHASE", label: "Compra de produto" },
  { value: "PRODUCT_USE", label: "Uso de produto" },
  { value: "MAINTENANCE", label: "Manutenção" },
  { value: "OBSERVATION", label: "Observação" },
  { value: "HARVEST", label: "Colheita" },
  { value: "OTHER", label: "Outro" },
];

function emptyForm(plantingId = "") {
  return {
    plantingId,
    entryDate: toInputDate(),
    activityType: "INSPECTION",
    activity: "",
    weatherCondition: "",
    appliedProducts: "",
    products: [],
    observations: "",
    rainfallMillimeters: "",
    productId: "",
    productName: "",
    productType: "PESTICIDE",
    quantity: "",
    unit: "LITER",
    supplier: "",
    amount: "",
    machineId: "",
    harvestQuantity: "",
    harvestUnit: "Sacas",
  };
}

export function FieldDiaryPage() {
  const [plantings, setPlantings] = useState([]);
  const [entries, setEntries] = useState([]);
  const [inventoryProducts, setInventoryProducts] = useState([]);
  const [machines, setMachines] = useState([]);
  const [selectedPlantingId, setSelectedPlantingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [searchParams, setSearchParams] = useSearchParams();

  const loadEntries = useCallback(async (plantingId) => {
    setLoading(true);
    try {
      const page = await api.getDiaryEntries(plantingId);
      setEntries(page.content);
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    api
      .getAllPlantings()
      .then((page) => setPlantings(page.content))
      .catch((requestError) => setError(requestError.message));
    api
      .getInventoryProducts()
      .then(setInventoryProducts)
      .catch(() => {});
    api
      .getMachines()
      .then(setMachines)
      .catch(() => {});
    loadEntries("");
  }, [loadEntries]);

  useEffect(() => {
    const quickType = searchParams.get("new");
    if (!quickType || plantings.length === 0) return;
    const type = quickType === "rain" ? "RAIN" : "OBSERVATION";
    setEditing(null);
    setForm({
      ...emptyForm(searchParams.get("plantingId") || ""),
      activityType: type,
    });
    setModalOpen(true);
    setSearchParams({});
  }, [plantings, searchParams, setSearchParams]);

  useEffect(() => {
    loadEntries(selectedPlantingId);
  }, [selectedPlantingId, loadEntries]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm(selectedPlantingId));
    setModalOpen(true);
    setError("");
  }

  function openEdit(entry) {
    setEditing(entry);
    setForm({
      plantingId: entry.plantingId,
      entryDate: entry.entryDate,
      activityType: entry.activityType,
      activity: entry.activity,
      weatherCondition: entry.weatherCondition || "",
      appliedProducts: entry.appliedProducts || "",
      products: entry.products || [],
      observations: entry.observations || "",
      rainfallMillimeters: entry.rainfallMillimeters || "",
      productId: "",
      productName: "",
      productType: "PESTICIDE",
      quantity: "",
      unit: "LITER",
      supplier: entry.supplier || "",
      amount: entry.amount || "",
      machineId: entry.machineId || "",
      harvestQuantity: entry.harvestQuantity || "",
      harvestUnit: entry.harvestUnit || "Sacas",
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
      plantingId: form.plantingId || null,
      weatherCondition: form.weatherCondition || null,
      appliedProducts: form.appliedProducts || null,
      products: form.products
        .filter((item) => item.productId && Number(item.quantity) > 0)
        .map((item) => ({
          productId: item.productId,
          quantity: Number(item.quantity),
        })),
      observations: form.observations || null,
      rainfallMillimeters: form.rainfallMillimeters
        ? Number(form.rainfallMillimeters)
        : null,
      productId: form.productId || null,
      productName: form.productName || null,
      quantity: form.quantity ? Number(form.quantity) : null,
      supplier: form.supplier || null,
      amount: form.amount ? Number(form.amount) : null,
      machineId: form.machineId || null,
      harvestQuantity: form.harvestQuantity
        ? Number(form.harvestQuantity)
        : null,
    };

    try {
      if (editing) {
        await api.updateDiaryEntry(editing.id, payload);
        setSuccess("Registro e estoque atualizados.");
      } else {
        await api.createDiaryEntry(payload);
        setSuccess(
          "Acontecimento registrado e módulos relacionados atualizados.",
        );
      }
      setModalOpen(false);
      await loadEntries(selectedPlantingId);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(entry) {
    if (!window.confirm(`Excluir o registro “${entry.activity}”?`)) return;

    try {
      await api.deleteDiaryEntry(entry.id);
      setSuccess("Registro excluído e produtos devolvidos ao estoque.");
      await loadEntries(selectedPlantingId);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Rotina de campo"
        title="Diário da lavoura"
        description="Registre rapidamente o que aconteceu no plantio ou na propriedade."
        action={
          <button className="button button--primary" onClick={openCreate}>
            <Plus size={18} /> Nova atividade
          </button>
        }
      />

      <ErrorBanner message={error} />
      <SuccessBanner message={success} />

      <>
        <section className="diary-filter">
          <div>
            <span className="eyebrow">Filtrar histórico</span>
            <label>
              <span className="sr-only">Escolher plantio</span>
              <select
                value={selectedPlantingId}
                onChange={(event) => setSelectedPlantingId(event.target.value)}
              >
                <option value="">Todos os plantios</option>
                {plantings.map((planting) => (
                  <option key={planting.id} value={planting.id}>
                    {planting.crop} — {planting.harvest}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <span>
            <BookOpenText size={22} />
            {entries.length} {entries.length === 1 ? "registro" : "registros"}
          </span>
        </section>

        {loading ? (
          <LoadingState label="Abrindo o diário..." />
        ) : entries.length === 0 ? (
          <EmptyState
            title="Nenhuma atividade registrada"
            description="Anote uma vistoria, chuva, compra, manutenção ou observação."
            action={
              <button className="button button--primary" onClick={openCreate}>
                <Plus size={18} /> Registrar atividade
              </button>
            }
          />
        ) : (
          <section className="diary-timeline">
            {entries.map((entry) => (
              <article key={entry.id} className="diary-entry">
                <div className="diary-entry__date">
                  <strong>
                    {new Intl.DateTimeFormat("pt-BR", {
                      day: "2-digit",
                    }).format(new Date(`${entry.entryDate}T12:00:00`))}
                  </strong>
                  <span>
                    {new Intl.DateTimeFormat("pt-BR", {
                      month: "short",
                    }).format(new Date(`${entry.entryDate}T12:00:00`))}
                  </span>
                </div>
                <div className="diary-entry__content">
                  <header>
                    <div>
                      <span className="badge">{entry.activityTypeName}</span>
                      <h2>{entry.activity}</h2>
                      <small>
                        {entry.crop
                          ? `${entry.crop} · ${entry.harvest}`
                          : "Propriedade em geral"}{" "}
                        · {formatDate(entry.entryDate)}
                      </small>
                    </div>
                    <div className="card-actions">
                      <button
                        className="icon-button"
                        onClick={() => openEdit(entry)}
                        aria-label="Editar atividade"
                      >
                        <Edit3 size={17} />
                      </button>
                      <button
                        className="icon-button icon-button--danger"
                        onClick={() => handleDelete(entry)}
                        aria-label="Excluir atividade"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </header>
                  <div className="diary-entry__details">
                    {entry.weatherCondition && (
                      <span>
                        <CloudSun size={16} /> {entry.weatherCondition}
                      </span>
                    )}
                    {entry.products?.map((product) => (
                      <span key={product.productId}>
                        <FlaskConical size={16} /> {product.productName}:{" "}
                        {product.quantity} {product.unitName}
                      </span>
                    ))}
                  </div>
                  {entry.observations && <p>{entry.observations}</p>}
                </div>
              </article>
            ))}
          </section>
        )}
      </>

      {modalOpen && (
        <Modal
          title={editing ? "Editar atividade" : "Nova atividade"}
          description="Registre o trabalho como ele aconteceu no campo."
          onClose={() => setModalOpen(false)}
        >
          <form className="form" onSubmit={handleSubmit}>
            <DynamicDiaryFields
              form={form}
              setForm={setForm}
              plantings={plantings}
              products={inventoryProducts}
              machines={machines}
              activityTypes={activityTypes}
              today={toInputDate()}
            />
            <fieldset disabled hidden>
              <label className="form-grid__full">
                <span>Plantio</span>
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
              <label>
                <span>Data</span>
                <input
                  required
                  type="date"
                  max={toInputDate()}
                  value={form.entryDate}
                  onChange={(event) =>
                    setForm({ ...form, entryDate: event.target.value })
                  }
                />
              </label>
              <label>
                <span>Tipo</span>
                <select
                  value={form.activityType}
                  onChange={(event) =>
                    setForm({ ...form, activityType: event.target.value })
                  }
                >
                  {activityTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-grid__full">
                <span>Atividade realizada</span>
                <input
                  required
                  maxLength="160"
                  value={form.activity}
                  onChange={(event) =>
                    setForm({ ...form, activity: event.target.value })
                  }
                  placeholder="Ex.: Aplicação de fungicida"
                />
              </label>
              <label>
                <span>
                  Condição do tempo <small>(opcional)</small>
                </span>
                <input
                  maxLength="120"
                  value={form.weatherCondition}
                  onChange={(event) =>
                    setForm({ ...form, weatherCondition: event.target.value })
                  }
                  placeholder="Ex.: Nublado e sem vento"
                />
              </label>
              <div className="form-grid__full diary-products-field">
                <div className="diary-products-field__header">
                  <span>
                    Produtos aplicados <small>(opcional)</small>
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        products: [
                          ...form.products,
                          { productId: "", quantity: "" },
                        ],
                      })
                    }
                  >
                    <Plus size={15} /> Adicionar produto
                  </button>
                </div>
                {form.products.map((product, index) => (
                  <div className="diary-product-row" key={index}>
                    <select
                      value={product.productId}
                      onChange={(event) => {
                        const products = [...form.products];
                        products[index] = {
                          ...product,
                          productId: event.target.value,
                        };
                        setForm({ ...form, products });
                      }}
                    >
                      <option value="">Escolha o produto</option>
                      {inventoryProducts.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} — saldo {item.quantity} {item.unitName}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="0.001"
                      step="0.001"
                      placeholder="Quantidade"
                      value={product.quantity}
                      onChange={(event) => {
                        const products = [...form.products];
                        products[index] = {
                          ...product,
                          quantity: event.target.value,
                        };
                        setForm({ ...form, products });
                      }}
                    />
                    <button
                      type="button"
                      aria-label="Remover produto"
                      onClick={() =>
                        setForm({
                          ...form,
                          products: form.products.filter(
                            (_, itemIndex) => itemIndex !== index,
                          ),
                        })
                      }
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                {inventoryProducts.length === 0 && (
                  <small>
                    Cadastre produtos no Estoque para selecioná-los aqui.
                  </small>
                )}
                {inventoryProducts.length > 0 && (
                  <small>
                    As quantidades informadas serão baixadas automaticamente do
                    estoque.
                  </small>
                )}
              </div>
              <label className="form-grid__full">
                <span>
                  Observações <small>(opcional)</small>
                </span>
                <textarea
                  rows="3"
                  maxLength="1000"
                  value={form.observations}
                  onChange={(event) =>
                    setForm({ ...form, observations: event.target.value })
                  }
                  placeholder="Anotações importantes da atividade"
                />
              </label>
            </fieldset>
            <div className="form-actions">
              <button
                type="button"
                className="button button--ghost"
                onClick={() => setModalOpen(false)}
              >
                Cancelar
              </button>
              <button className="button button--primary" disabled={saving}>
                {saving ? "Salvando..." : "Salvar atividade"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
