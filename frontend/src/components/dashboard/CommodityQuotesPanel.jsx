import { ExternalLink, LoaderCircle, RefreshCw } from "lucide-react";
import { formatCurrency, formatDate } from "../../utils/formatters";

export function CommodityQuotesPanel({
  commodityQuotes,
  quotesError,
  quotesLoading,
  onRetry,
}) {
  return (
    <section
      className="panel quotation-panel"
      aria-labelledby="quotation-title"
    >
      <div className="panel__header quotation-panel__header">
        <div>
          <span className="eyebrow">Mercado agrícola</span>
          <h2 id="quotation-title">Cotações e variação de mercado</h2>
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
            onClick={onRetry}
          >
            <RefreshCw size={16} /> Tentar novamente
          </button>
        </div>
      ) : (
        <CommodityQuotesContent commodityQuotes={commodityQuotes} />
      )}
    </section>
  );
}

function CommodityQuotesContent({ commodityQuotes }) {
  if (!commodityQuotes) {
    return null;
  }

  return (
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
        {commodityQuotes.stale && " Exibindo a última atualização disponível."}
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
  );
}
