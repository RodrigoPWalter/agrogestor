import {
  Calculator,
  CircleDollarSign,
  PackageCheck,
  Sprout,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import { useState } from "react";
import { api } from "../api/client";
import { ErrorBanner } from "../components/Feedback";
import { PageHeader } from "../components/PageHeader";
import { SeedingCalculator } from "../components/SeedingCalculator";
import { formatCurrency, formatNumber } from "../utils/formatters";

const initialForm = {
  hectares: "",
  expectedYieldBagsPerHectare: "",
  estimatedPricePerBag: "",
  cost: "",
};

export function CalculatorPage() {
  const [calculatorMode, setCalculatorMode] = useState("financial");
  const [form, setForm] = useState(initialForm);
  const [costMode, setCostMode] = useState("perHectare");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload = {
        hectares: Number(form.hectares),
        expectedYieldBagsPerHectare: Number(form.expectedYieldBagsPerHectare),
        estimatedPricePerBag: Number(form.estimatedPricePerBag),
        totalEstimatedCost: costMode === "total" ? Number(form.cost) : null,
        costPerHectare: costMode === "perHectare" ? Number(form.cost) : null,
      };
      setResult(await api.calculateProduction(payload));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Planejamento da safra"
        title="Calculadoras"
        description="Planeje o retorno financeiro e confira a distribuição das sementes."
      />

      <div
        className="calculator-mode-switch"
        role="tablist"
        aria-label="Tipo de cálculo"
      >
        <button
          type="button"
          role="tab"
          aria-selected={calculatorMode === "financial"}
          className={calculatorMode === "financial" ? "is-active" : ""}
          onClick={() => setCalculatorMode("financial")}
        >
          <CircleDollarSign size={19} />
          <span>
            <strong>Produção e lucro</strong>
            <small>Estimativa financeira</small>
          </span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={calculatorMode === "seeding"}
          className={calculatorMode === "seeding" ? "is-active" : ""}
          onClick={() => setCalculatorMode("seeding")}
        >
          <Sprout size={19} />
          <span>
            <strong>Semeadura</strong>
            <small>Sementes por metro</small>
          </span>
        </button>
      </div>

      {calculatorMode === "seeding" ? (
        <SeedingCalculator />
      ) : (
        <>
          <ErrorBanner message={error} />
          <div className="calculator-layout">
            <section className="panel calculator-form-panel">
              <div className="panel__header">
                <div>
                  <span className="panel-number">1</span>
                  <h2>Informe os dados</h2>
                </div>
              </div>
              <form className="form" onSubmit={handleSubmit}>
                <div className="form-grid">
                  <label>
                    <span>Área plantada (ha)</span>
                    <input
                      required
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={form.hectares}
                      onChange={(event) =>
                        setForm({ ...form, hectares: event.target.value })
                      }
                      placeholder="100"
                    />
                  </label>
                  <label>
                    <span>Produtividade (sacas/ha)</span>
                    <input
                      required
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={form.expectedYieldBagsPerHectare}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          expectedYieldBagsPerHectare: event.target.value,
                        })
                      }
                      placeholder="60"
                    />
                  </label>
                  <label className="form-grid__full">
                    <span>Preço estimado da saca (R$)</span>
                    <input
                      required
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={form.estimatedPricePerBag}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          estimatedPricePerBag: event.target.value,
                        })
                      }
                      placeholder="130,00"
                    />
                  </label>
                </div>

                <fieldset className="choice-fieldset">
                  <legend>Como deseja informar o custo?</legend>
                  <div className="segmented-control">
                    <label
                      className={costMode === "perHectare" ? "is-selected" : ""}
                    >
                      <input
                        type="radio"
                        name="costMode"
                        value="perHectare"
                        checked={costMode === "perHectare"}
                        onChange={() => setCostMode("perHectare")}
                      />
                      Por hectare
                    </label>
                    <label
                      className={costMode === "total" ? "is-selected" : ""}
                    >
                      <input
                        type="radio"
                        name="costMode"
                        value="total"
                        checked={costMode === "total"}
                        onChange={() => setCostMode("total")}
                      />
                      Custo total
                    </label>
                  </div>
                </fieldset>

                <label>
                  <span>
                    {costMode === "perHectare"
                      ? "Custo por hectare (R$)"
                      : "Custo total estimado (R$)"}
                  </span>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.cost}
                    onChange={(event) =>
                      setForm({ ...form, cost: event.target.value })
                    }
                    placeholder={
                      costMode === "perHectare" ? "4.500,00" : "450.000,00"
                    }
                  />
                </label>

                <button
                  type="submit"
                  className="button button--primary button--wide"
                  disabled={loading}
                >
                  <Calculator size={19} />{" "}
                  {loading ? "Calculando..." : "Calcular estimativa"}
                </button>
              </form>
            </section>

            <section
              className={`calculator-result ${result ? "has-result" : ""}`}
            >
              {!result ? (
                <div className="calculator-placeholder">
                  <span>
                    <TrendingUp size={34} />
                  </span>
                  <h2>Seu resultado aparecerá aqui</h2>
                  <p>Preencha os dados ao lado para visualizar a estimativa.</p>
                </div>
              ) : (
                <>
                  <div className="result-heading">
                    <span className="panel-number">2</span>
                    <div>
                      <small>Resultado estimado</small>
                      <h2>Projeção da safra</h2>
                    </div>
                  </div>
                  <div className="result-grid">
                    <article>
                      <PackageCheck size={22} />
                      <span>Produção total</span>
                      <strong>
                        {formatNumber(result.totalEstimatedProductionBags)}{" "}
                        sacas
                      </strong>
                    </article>
                    <article>
                      <CircleDollarSign size={22} />
                      <span>Faturamento bruto</span>
                      <strong>
                        {formatCurrency(result.estimatedGrossRevenue)}
                      </strong>
                    </article>
                    <article>
                      <WalletCards size={22} />
                      <span>Custo total</span>
                      <strong>{formatCurrency(result.totalCost)}</strong>
                    </article>
                  </div>
                  <article
                    className={`profit-card ${Number(result.estimatedProfit) < 0 ? "profit-card--negative" : ""}`}
                  >
                    <div>
                      <span>
                        {Number(result.estimatedProfit) < 0
                          ? "Prejuízo estimado"
                          : "Lucro estimado"}
                      </span>
                      <strong>{formatCurrency(result.estimatedProfit)}</strong>
                    </div>
                    <TrendingUp size={34} />
                  </article>
                  <p className="result-disclaimer">
                    Esta é uma estimativa para apoiar o planejamento. Preços e
                    produtividade podem variar.
                  </p>
                </>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
