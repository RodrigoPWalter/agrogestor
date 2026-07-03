import {
  ArrowRight,
  BookOpenText,
  Calculator,
  CircleDollarSign,
  CloudRain,
  Droplets,
  ExternalLink,
  Gauge,
  LandPlot,
  LoaderCircle,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  ThermometerSun,
  ReceiptText,
  Sprout,
  TrendingUp,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { ErrorBanner, LoadingState } from "../components/Feedback";
import { PageHeader } from "../components/PageHeader";
import { formatCurrency, formatDate, formatNumber } from "../utils/formatters";

export function DashboardPage() {
  const [plantings, setPlantings] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [commodityQuotes, setCommodityQuotes] = useState(null);
  const [quotesLoading, setQuotesLoading] = useState(true);
  const [quotesError, setQuotesError] = useState("");
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState("");
  const [locationSearchOpen, setLocationSearchOpen] = useState(false);
  const [locationQuery, setLocationQuery] = useState("");
  const [locationResults, setLocationResults] = useState([]);
  const [locationLoading, setLocationLoading] = useState(false);

  useEffect(() => {
    Promise.all([api.getPlantings(), api.getExpenses()])
      .then(([plantingPage, expensePage]) => {
        setPlantings(plantingPage.content);
        setExpenses(expensePage.content);
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  function loadCommodityQuotes() {
    setQuotesLoading(true);
    setQuotesError("");
    api
      .getCommodityQuotes()
      .then(setCommodityQuotes)
      .catch((requestError) => setQuotesError(requestError.message))
      .finally(() => setQuotesLoading(false));
  }

  useEffect(() => {
    loadCommodityQuotes();
  }, []);

  function loadWeather() {
    setWeatherLoading(true);
    setWeatherError("");
    api
      .getWeatherForecast()
      .then(setWeather)
      .catch((requestError) => setWeatherError(requestError.message))
      .finally(() => setWeatherLoading(false));
  }

  useEffect(() => {
    loadWeather();
  }, []);

  async function searchLocations(event) {
    event.preventDefault();
    if (locationQuery.trim().length < 3) return;
    setLocationLoading(true);
    try {
      setLocationResults(
        await api.searchWeatherLocations(locationQuery.trim()),
      );
    } catch (requestError) {
      setWeatherError(requestError.message);
    } finally {
      setLocationLoading(false);
    }
  }

  async function selectLocation(location) {
    setLocationLoading(true);
    try {
      await api.selectWeatherLocation(location);
      setLocationSearchOpen(false);
      setLocationResults([]);
      setLocationQuery("");
      loadWeather();
    } catch (requestError) {
      setWeatherError(requestError.message);
    } finally {
      setLocationLoading(false);
    }
  }

  const metrics = useMemo(() => {
    const hectares = plantings.reduce(
      (total, planting) => total + Number(planting.plantedAreaHectares),
      0,
    );
    const totalExpenses = expenses.reduce(
      (total, expense) => total + Number(expense.amount),
      0,
    );
    const currentHarvest =
      [...new Set(plantings.map((item) => item.harvest))].sort().reverse()[0] ||
      "—";

    const costPerHectare = hectares > 0 ? totalExpenses / hectares : 0;

    return { hectares, totalExpenses, costPerHectare, currentHarvest };
  }, [plantings, expenses]);

  if (loading) {
    return (
      <div className="page">
        <LoadingState label="Organizando a propriedade..." />
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Resumo operacional"
        title="Visão geral da propriedade"
        description="Indicadores consolidados da safra e informações para a operação diária."
        action={
          <Link className="button button--primary" to="/plantios">
            <Plus size={18} /> Novo plantio
          </Link>
        }
      />

      <ErrorBanner message={error} />

      <section className="metric-grid" aria-label="Indicadores principais">
        <article className="metric-card metric-card--green">
          <span className="metric-card__icon">
            <LandPlot size={22} />
          </span>
          <div>
            <small>Área plantada</small>
            <strong>{formatNumber(metrics.hectares)} ha</strong>
            <span>
              {plantings.length}{" "}
              {plantings.length === 1 ? "plantio ativo" : "plantios ativos"}
            </span>
          </div>
        </article>
        <article className="metric-card metric-card--gold">
          <span className="metric-card__icon">
            <CircleDollarSign size={22} />
          </span>
          <div>
            <small>Gastos registrados</small>
            <strong>{formatCurrency(metrics.totalExpenses)}</strong>
            <span>{expenses.length} lançamentos</span>
          </div>
        </article>
        <article className="metric-card metric-card--blue">
          <span className="metric-card__icon">
            <Sprout size={22} />
          </span>
          <div>
            <small>Safra mais recente</small>
            <strong>{metrics.currentHarvest}</strong>
            <span>Histórico organizado</span>
          </div>
        </article>
        <article className="metric-card metric-card--neutral">
          <span className="metric-card__icon">
            <Gauge size={22} />
          </span>
          <div>
            <small>Custo médio por hectare</small>
            <strong>{formatCurrency(metrics.costPerHectare)}</strong>
            <span>Considerando a área ativa</span>
          </div>
        </article>
      </section>

      <section className="weather-panel" aria-labelledby="weather-title">
        {weatherLoading ? (
          <div className="weather-status">
            <LoaderCircle className="spin" /> Buscando a previsão...
          </div>
        ) : weatherError ? (
          <div className="weather-status">
            <span>{weatherError}</span>
            <button className="button button--ghost" onClick={loadWeather}>
              <RefreshCw size={16} /> Tentar novamente
            </button>
          </div>
        ) : (
          <>
            <div className="weather-current">
              <span className="weather-current__icon">
                <ThermometerSun size={30} />
              </span>
              <div>
                <span className="eyebrow">Clima na propriedade</span>
                <h2 id="weather-title">{weather.location}</h2>
                <p>
                  {weather.currentCondition} · Sensação de{" "}
                  {formatNumber(weather.apparentTemperature, 1)}°C
                </p>
                <button
                  className="weather-location-button"
                  type="button"
                  onClick={() => setLocationSearchOpen((current) => !current)}
                >
                  <MapPin size={13} /> Alterar cidade
                </button>
              </div>
              <strong>{formatNumber(weather.currentTemperature, 1)}°</strong>
            </div>
            <div className="weather-days">
              {weather.days.map((day, index) => (
                <article key={day.date}>
                  <strong>
                    {index === 0
                      ? "Hoje"
                      : new Intl.DateTimeFormat("pt-BR", {
                          weekday: "short",
                        }).format(new Date(`${day.date}T12:00:00`))}
                  </strong>
                  <span>
                    <CloudRain size={16} /> {day.rainProbability}%
                  </span>
                  <span>
                    <Droplets size={16} />{" "}
                    {formatNumber(day.expectedRainMillimeters, 1)} mm
                  </span>
                  <small>
                    {formatNumber(day.minimumTemperature, 0)}° /{" "}
                    {formatNumber(day.maximumTemperature, 0)}°
                  </small>
                </article>
              ))}
            </div>
            {weather.alerts.length > 0 && (
              <div className="weather-alerts">
                {weather.alerts.map((alert) => (
                  <span key={alert.type}>{alert.message}</span>
                ))}
              </div>
            )}
            <a
              className="weather-source"
              href={weather.sourceUrl}
              target="_blank"
              rel="noreferrer"
            >
              Previsão por {weather.sourceName}
              {weather.stale ? " · última atualização disponível" : ""}
            </a>
            {locationSearchOpen && (
              <div className="weather-location-search">
                <form onSubmit={searchLocations}>
                  <Search size={17} />
                  <input
                    autoFocus
                    value={locationQuery}
                    onChange={(event) => setLocationQuery(event.target.value)}
                    placeholder="Digite sua cidade"
                    minLength="3"
                  />
                  <button disabled={locationLoading}>
                    {locationLoading ? "Buscando..." : "Buscar"}
                  </button>
                </form>
                {locationResults.length > 0 && (
                  <div>
                    {locationResults.map((location) => (
                      <button
                        type="button"
                        key={`${location.latitude}-${location.longitude}`}
                        onClick={() => selectLocation(location)}
                      >
                        <strong>{location.city}</strong>
                        <span>
                          {[location.region, location.country]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </section>

      <section
        className="panel quotation-panel"
        aria-labelledby="quotation-title"
      >
        <div className="panel__header quotation-panel__header">
          <div>
            <div>
              <span className="eyebrow">Mercado agrícola</span>
              <h2 id="quotation-title">Cotações e variação de mercado</h2>
            </div>
          </div>
          {commodityQuotes && (
            <a
              className="text-link quotation-source"
              href={commodityQuotes.sourceUrl}
              target="_blank"
              rel="noreferrer"
            >
              Fonte: {commodityQuotes.sourceName} <ExternalLink size={14} />
            </a>
          )}
        </div>

        {quotesLoading ? (
          <div className="quotation-status">
            <LoaderCircle className="spin" size={20} />
            Atualizando cotações...
          </div>
        ) : quotesError ? (
          <div className="quotation-status quotation-status--error">
            <span>{quotesError}</span>
            <button
              className="button button--ghost"
              type="button"
              onClick={loadCommodityQuotes}
            >
              <RefreshCw size={16} /> Tentar novamente
            </button>
          </div>
        ) : (
          <>
            <div className="quotation-grid">
              {commodityQuotes.quotes.map((quote) => (
                <article className="quotation-card" key={quote.commodity}>
                  <span className="quotation-card__crop">
                    {quote.commodity.slice(0, 2).toUpperCase()}
                  </span>
                  <div>
                    <small>{quote.commodity}</small>
                    <strong>{formatCurrency(quote.price)}</strong>
                    <span>Valor divulgado</span>
                  </div>
                </article>
              ))}
            </div>
            <p className="quotation-note">
              Cotação de {formatDate(commodityQuotes.quotationDate)}.
              {commodityQuotes.stale &&
                " Exibindo a última atualização disponível."}
            </p>
            {commodityQuotes.history?.length > 1 && (
              <div className="quotation-history">
                <h3>Histórico recente</h3>
                <div>
                  <table>
                    <thead>
                      <tr>
                        <th>Data</th>
                        {commodityQuotes.quotes.map((quote) => (
                          <th key={quote.commodity}>{quote.commodity}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {commodityQuotes.history.slice(0, 7).map((day) => (
                        <tr key={day.quotationDate}>
                          <td>{formatDate(day.quotationDate)}</td>
                          {commodityQuotes.quotes.map((quote) => {
                            const value = day.quotes.find(
                              (item) => item.commodity === quote.commodity,
                            );
                            return (
                              <td key={quote.commodity}>
                                {value ? formatCurrency(value.price) : "—"}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel__header">
            <div>
              <span className="eyebrow">Acesso rápido</span>
              <h2>O que você quer fazer?</h2>
            </div>
          </div>
          <div className="quick-actions">
            <Link to="/plantios" className="quick-action">
              <span className="quick-action__icon quick-action__icon--green">
                <Sprout />
              </span>
              <div>
                <strong>Gerenciar plantios</strong>
                <small>Cadastre e acompanhe as safras</small>
              </div>
              <ArrowRight size={19} />
            </Link>
            <Link to="/calculadora" className="quick-action">
              <span className="quick-action__icon quick-action__icon--gold">
                <Calculator />
              </span>
              <div>
                <strong>Calcular produção</strong>
                <small>Estime faturamento e lucro</small>
              </div>
              <ArrowRight size={19} />
            </Link>
            <Link to="/gastos" className="quick-action">
              <span className="quick-action__icon quick-action__icon--blue">
                <ReceiptText />
              </span>
              <div>
                <strong>Registrar gasto</strong>
                <small>Controle custos por plantio</small>
              </div>
              <ArrowRight size={19} />
            </Link>
            <Link to="/diario" className="quick-action">
              <span className="quick-action__icon quick-action__icon--green">
                <BookOpenText />
              </span>
              <div>
                <strong>Atualizar diário</strong>
                <small>Registre atividades realizadas no campo</small>
              </div>
              <ArrowRight size={19} />
            </Link>
          </div>
        </section>

        <section className="panel">
          <div className="panel__header">
            <div>
              <span className="eyebrow">Mais recentes</span>
              <h2>Últimos plantios</h2>
            </div>
            <Link to="/plantios" className="text-link">
              Ver todos
            </Link>
          </div>

          {plantings.length === 0 ? (
            <div className="compact-empty">
              <Sprout size={28} />
              <p>Nenhum plantio cadastrado ainda.</p>
            </div>
          ) : (
            <div className="data-table-wrapper">
              <table className="data-table dashboard-planting-table">
                <thead>
                  <tr>
                    <th>Cultura</th>
                    <th>Safra</th>
                    <th>Área</th>
                    <th>Plantio</th>
                  </tr>
                </thead>
                <tbody>
                  {plantings.slice(0, 5).map((planting) => (
                    <tr key={planting.id}>
                      <td>
                        <span className="table-primary">{planting.crop}</span>
                        <small>{planting.seedVariety}</small>
                      </td>
                      <td>{planting.harvest}</td>
                      <td className="numeric-value">
                        {formatNumber(planting.plantedAreaHectares)} ha
                      </td>
                      <td>{formatDate(planting.plantingDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <section className="tip-banner">
        <span>
          <TrendingUp size={23} />
        </span>
        <div>
          <strong>Dica do AgroGestor</strong>
          <p>
            Registre os gastos sempre que eles acontecerem. Assim, o custo por
            hectare fica confiável.
          </p>
        </div>
      </section>
    </div>
  );
}
