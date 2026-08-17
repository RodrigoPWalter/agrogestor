import { Save, X } from "lucide-react";
import { formatCurrency, formatNumber } from "../../utils/formatters";

export function ProductionSaleForm({
  form,
  maximumQuantity,
  editing,
  saving,
  onChange,
  onCancel,
  onSubmit,
}) {
  const estimatedTotal =
    Number(form.quantityBags || 0) * Number(form.pricePerBag || 0);

  return (
    <form className="production-sale-form" onSubmit={onSubmit}>
      <div className="production-sale-form__heading">
        <div>
          <strong>{editing ? "Editar venda" : "Nova venda"}</strong>
          <span>
            Saldo disponível: {formatNumber(maximumQuantity, 3)} sacas de 60 kg
          </span>
        </div>
        <button
          className="icon-button"
          type="button"
          onClick={onCancel}
          aria-label="Fechar formulário de venda"
        >
          <X size={18} />
        </button>
      </div>

      <div className="form-grid">
        <label>
          <span>Data da venda</span>
          <input
            required
            type="date"
            value={form.saleDate}
            onChange={(event) =>
              onChange({ ...form, saleDate: event.target.value })
            }
          />
        </label>
        <label>
          <span>Quantidade (sacas de 60 kg)</span>
          <input
            required
            type="number"
            min="0.001"
            max={maximumQuantity || undefined}
            step="0.001"
            inputMode="decimal"
            placeholder="Ex.: 150"
            value={form.quantityBags}
            onChange={(event) =>
              onChange({ ...form, quantityBags: event.target.value })
            }
          />
        </label>
        <label>
          <span>Preço por saca</span>
          <input
            required
            type="number"
            min="0.01"
            step="0.01"
            inputMode="decimal"
            placeholder="Ex.: 72,50"
            value={form.pricePerBag}
            onChange={(event) =>
              onChange({ ...form, pricePerBag: event.target.value })
            }
          />
        </label>
        <label>
          <span>Comprador (opcional)</span>
          <input
            maxLength={120}
            placeholder="Ex.: Cooperativa local"
            value={form.buyer}
            onChange={(event) =>
              onChange({ ...form, buyer: event.target.value })
            }
          />
        </label>
        <label className="form-grid__full">
          <span>Observação (opcional)</span>
          <textarea
            rows="2"
            maxLength={1000}
            value={form.observations}
            onChange={(event) =>
              onChange({ ...form, observations: event.target.value })
            }
          />
        </label>
      </div>

      <div className="production-sale-form__footer">
        <span>
          Valor desta venda: <strong>{formatCurrency(estimatedTotal)}</strong>
        </span>
        <div>
          <button
            className="button button--ghost"
            type="button"
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button className="button button--primary" disabled={saving}>
            <Save size={17} /> {saving ? "Salvando..." : "Salvar venda"}
          </button>
        </div>
      </div>
    </form>
  );
}
