import { Pencil, Plus, ShoppingCart, Trash2, Warehouse } from "lucide-react";
import { useState } from "react";
import { api } from "../../api/client";
import { useSingleFlight } from "../../hooks/useSingleFlight";
import { mutationFeedback } from "../../offline/offlineFeedback";
import { isOfflineResult } from "../../offline/offlineSync";
import {
  formatCurrency,
  formatDate,
  formatNumber,
  toInputDate,
} from "../../utils/formatters";
import { useConfirmation } from "../ConfirmationProvider";
import { ErrorBanner, SuccessBanner } from "../Feedback";
import { ProductionSaleForm } from "./ProductionSaleForm";

const emptySale = {
  saleDate: toInputDate(),
  quantityBags: "",
  pricePerBag: "",
  buyer: "",
  observations: "",
};

export function ProductionSalesSection({ stock, sales, onChanged }) {
  const requestConfirmation = useConfirmation();
  const { pending: saving, run: runSaving } = useSingleFlight();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptySale);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const maximumQuantity =
    Number(stock?.availableBags || 0) + Number(editing?.quantityBags || 0);

  function openCreate() {
    setEditing(null);
    setForm(emptySale);
    setFormOpen(true);
    setError("");
  }

  function openEdit(sale) {
    setEditing(sale);
    setForm({
      saleDate: sale.saleDate,
      quantityBags: sale.quantityBags,
      pricePerBag: sale.pricePerBag,
      buyer: sale.buyer || "",
      observations: sale.observations || "",
    });
    setFormOpen(true);
    setError("");
  }

  function closeForm() {
    setEditing(null);
    setForm(emptySale);
    setFormOpen(false);
  }

  async function submit(event) {
    event.preventDefault();
    await runSaving(async () => {
      setError("");
      const payload = {
        saleDate: form.saleDate,
        quantityBags: Number(form.quantityBags),
        pricePerBag: Number(form.pricePerBag),
        buyer: form.buyer || null,
        observations: form.observations || null,
      };

      try {
        const result = editing
          ? await api.updateProductionSale(
              stock.plantingId,
              editing.id,
              payload,
            )
          : await api.createProductionSale(stock.plantingId, payload);
        setSuccess(
          mutationFeedback(
            result,
            editing
              ? "Venda atualizada."
              : "Venda registrada e saldo atualizado.",
          ),
        );
        closeForm();
        if (!isOfflineResult(result)) await onChanged();
      } catch (requestError) {
        setError(requestError.message);
      }
    });
  }

  async function remove(sale) {
    const confirmed = await requestConfirmation({
      title: "Excluir venda?",
      description: `${formatNumber(sale.quantityBags, 3)} sacas vendidas em ${formatDate(sale.saleDate)} voltarão ao saldo disponível.`,
      detail: `Valor do lançamento: ${formatCurrency(sale.totalAmount)}.`,
      confirmLabel: "Excluir venda",
    });
    if (!confirmed) return;

    try {
      const result = await api.deleteProductionSale(stock.plantingId, sale.id);
      setSuccess(mutationFeedback(result, "Venda excluída e saldo devolvido."));
      if (!isOfflineResult(result)) await onChanged();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <section className="production-sales-section">
      <div className="section-heading production-sales-heading">
        <div>
          <h3>
            <Warehouse size={17} /> Produção e vendas
          </h3>
          <p>O saldo nasce das colheitas e diminui a cada venda registrada.</p>
        </div>
        {!formOpen && (
          <button
            className="button button--primary"
            type="button"
            disabled={Number(stock?.availableBags || 0) <= 0}
            onClick={openCreate}
          >
            <Plus size={17} /> Registrar venda
          </button>
        )}
      </div>

      <ErrorBanner message={error} onDismiss={() => setError("")} />
      <SuccessBanner message={success} onDismiss={() => setSuccess("")} />

      <div className="production-stock-strip">
        <div>
          <span>Produção colhida</span>
          <strong>{formatNumber(stock?.harvestedBags, 3)} sc</strong>
        </div>
        <div>
          <span>Quantidade vendida</span>
          <strong>{formatNumber(stock?.soldBags, 3)} sc</strong>
        </div>
        <div className="production-stock-strip__available">
          <span>Saldo disponível</span>
          <strong>{formatNumber(stock?.availableBags, 3)} sc</strong>
        </div>
        <div>
          <span>Faturamento realizado</span>
          <strong>{formatCurrency(stock?.revenue)}</strong>
        </div>
      </div>

      {formOpen && (
        <ProductionSaleForm
          form={form}
          maximumQuantity={maximumQuantity}
          editing={Boolean(editing)}
          saving={saving}
          onChange={setForm}
          onCancel={closeForm}
          onSubmit={submit}
        />
      )}

      {sales.length === 0 ? (
        <div className="production-sales-empty">
          <ShoppingCart size={22} />
          <span>Nenhuma venda registrada para esta safra.</span>
        </div>
      ) : (
        <div className="data-table-wrapper production-sales-table-wrapper">
          <table className="data-table production-sales-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Comprador</th>
                <th className="number-column">Quantidade</th>
                <th className="number-column">Preço/sc</th>
                <th className="number-column">Total</th>
                <th className="actions-column">Ações</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale.id}>
                  <td data-label="Data">{formatDate(sale.saleDate)}</td>
                  <td data-label="Comprador">
                    {sale.buyer || "Não informado"}
                  </td>
                  <td data-label="Quantidade" className="number-column">
                    {formatNumber(sale.quantityBags, 3)} sc
                  </td>
                  <td data-label="Preço/sc" className="number-column">
                    {formatCurrency(sale.pricePerBag)}
                  </td>
                  <td
                    data-label="Total"
                    className="number-column production-sale-total"
                  >
                    {formatCurrency(sale.totalAmount)}
                  </td>
                  <td className="actions-column">
                    <button
                      className="icon-button"
                      type="button"
                      onClick={() => openEdit(sale)}
                      aria-label="Editar venda"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      className="icon-button icon-button--danger"
                      type="button"
                      onClick={() => remove(sale)}
                      aria-label="Excluir venda"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
