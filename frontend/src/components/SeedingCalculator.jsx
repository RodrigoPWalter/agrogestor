import { Gauge, LandPlot, PackageCheck, Ruler, Sprout } from "lucide-react";
import { useState } from "react";
import { api } from "../api/client";
import { formatNumber } from "../utils/formatters";
import { ErrorBanner } from "./Feedback";

const initialForm = {
  hectares: "18.5",
  rowSpacingCentimeters: "45",
  totalSeedCount: "",
  totalSeedWeightKilograms: "925",
  thousandSeedWeightGrams: "200",
  germinationPercentage: "90",
  fieldEmergencePercentage: "90",
};

export function SeedingCalculator() {
  const [form, setForm] = useState(initialForm);
  const [seedInputMode, setSeedInputMode] = useState("weight");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      hectares: Number(form.hectares),
      rowSpacingCentimeters: Number(form.rowSpacingCentimeters),
      totalSeedCount:
        seedInputMode === "count" ? Number(form.totalSeedCount) : null,
      totalSeedWeightKilograms:
        seedInputMode === "weight"
          ? Number(form.totalSeedWeightKilograms)
          : null,
      thousandSeedWeightGrams:
        seedInputMode === "weight"
          ? Number(form.thousandSeedWeightGrams)
          : null,
      germinationPercentage: Number(form.germinationPercentage),
      fieldEmergencePercentage: Number(form.fieldEmergencePercentage),
    };

    try {
      setResult(await api.calculateSeeding(payload));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <ErrorBanner message={error} />
      <div className="calculator-layout seeding-calculator">
        <section className="panel calculator-form-panel">
          <div className="panel__header">
            <div>
              <span className="panel-number">1</span>
              <h2>Dados da semeadura</h2>
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
                />
              </label>
              <label>
                <span>Espaçamento entre linhas (cm)</span>
                <input
                  required
                  type="number"
                  min="1"
                  step="0.01"
                  value={form.rowSpacingCentimeters}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      rowSpacingCentimeters: event.target.value,
                    })
                  }
                />
              </label>
            </div>

            <fieldset className="choice-fieldset">
              <legend>Como você mediu as sementes utilizadas?</legend>
              <div className="segmented-control">
                <label
                  className={seedInputMode === "weight" ? "is-selected" : ""}
                >
                  <input
                    type="radio"
                    name="seedInputMode"
                    checked={seedInputMode === "weight"}
                    onChange={() => setSeedInputMode("weight")}
                  />
                  Peso usado
                </label>
                <label
                  className={seedInputMode === "count" ? "is-selected" : ""}
                >
                  <input
                    type="radio"
                    name="seedInputMode"
                    checked={seedInputMode === "count"}
                    onChange={() => setSeedInputMode("count")}
                  />
                  Número de sementes
                </label>
              </div>
            </fieldset>

            {seedInputMode === "weight" ? (
              <div className="form-grid">
                <label>
                  <span>Peso total usado (kg)</span>
                  <input
                    required
                    type="number"
                    min="0.001"
                    step="0.001"
                    value={form.totalSeedWeightKilograms}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        totalSeedWeightKilograms: event.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  <span>Peso de mil sementes — PMS (g)</span>
                  <input
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.thousandSeedWeightGrams}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        thousandSeedWeightGrams: event.target.value,
                      })
                    }
                  />
                </label>
              </div>
            ) : (
              <label>
                <span>Total de sementes utilizadas</span>
                <input
                  required
                  type="number"
                  min="1"
                  step="1"
                  value={form.totalSeedCount}
                  onChange={(event) =>
                    setForm({ ...form, totalSeedCount: event.target.value })
                  }
                  placeholder="Ex.: 4.625.000"
                />
              </label>
            )}

            <div className="form-grid">
              <label>
                <span>Poder germinativo (%)</span>
                <input
                  required
                  type="number"
                  min="0.01"
                  max="100"
                  step="0.01"
                  value={form.germinationPercentage}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      germinationPercentage: event.target.value,
                    })
                  }
                />
              </label>
              <label>
                <span>Emergência esperada no campo (%)</span>
                <input
                  required
                  type="number"
                  min="0.01"
                  max="100"
                  step="0.01"
                  value={form.fieldEmergencePercentage}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      fieldEmergencePercentage: event.target.value,
                    })
                  }
                />
              </label>
            </div>

            <button
              type="submit"
              className="button button--primary button--wide"
              disabled={loading}
            >
              <Sprout size={19} />{" "}
              {loading ? "Calculando..." : "Calcular distribuição"}
            </button>
          </form>
        </section>

        <section
          className={`calculator-result seeding-result ${result ? "has-result" : ""}`}
        >
          {!result ? (
            <div className="calculator-placeholder">
              <span>
                <Gauge size={34} />
              </span>
              <h2>Descubra quantas sementes caíram por metro</h2>
              <p>
                Use os dados da área, regulagem e qualidade do lote para estimar
                o estande.
              </p>
            </div>
          ) : (
            <>
              <div className="result-heading">
                <span className="panel-number">2</span>
                <div>
                  <small>Distribuição estimada</small>
                  <h2>Resultado da semeadura</h2>
                </div>
              </div>

              <article className="seeds-per-meter-card">
                <span>Sementes largadas por metro linear</span>
                <strong>
                  {formatNumber(result.seedsPerLinearMeter)} sementes/m
                </strong>
                <small>
                  Estande esperado:{" "}
                  {formatNumber(result.expectedPlantsPerLinearMeter)} plantas/m
                </small>
              </article>

              <div className="result-grid seeding-result-grid">
                <article>
                  <PackageCheck size={22} />
                  <span>Sementes por hectare</span>
                  <strong>{formatNumber(result.seedsPerHectare, 0)}</strong>
                </article>
                <article>
                  <Sprout size={22} />
                  <span>Plantas esperadas/ha</span>
                  <strong>
                    {formatNumber(result.expectedPlantsPerHectare, 0)}
                  </strong>
                </article>
                <article>
                  <Ruler size={22} />
                  <span>Metros totais de linha</span>
                  <strong>{formatNumber(result.totalRowLengthMeters)} m</strong>
                </article>
                <article>
                  <LandPlot size={22} />
                  <span>Total estimado de sementes</span>
                  <strong>{formatNumber(result.totalEstimatedSeeds, 0)}</strong>
                </article>
              </div>

              <p className="result-disclaimer">
                A população esperada considera o poder germinativo e a
                emergência informados. Confira a regulagem da semeadora
                diretamente no campo.
              </p>
            </>
          )}
        </section>
      </div>
    </>
  );
}
