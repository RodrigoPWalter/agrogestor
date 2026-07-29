import { CloudSun, Edit3, FlaskConical, Trash2 } from "lucide-react";
import { formatDate } from "../../utils/formatters";

const dayFormatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit" });
const monthFormatter = new Intl.DateTimeFormat("pt-BR", { month: "short" });

function localDate(date) {
  return new Date(`${date}T12:00:00`);
}

export function DiaryTimeline({ entries, onEdit, onDelete }) {
  return (
    <section className="diary-timeline">
      {entries.map((entry) => {
        const entryDate = localDate(entry.entryDate);

        return (
          <article key={entry.id} className="diary-entry">
            <div className="diary-entry__date">
              <strong>{dayFormatter.format(entryDate)}</strong>
              <span>{monthFormatter.format(entryDate)}</span>
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
                    onClick={() => onEdit(entry)}
                    aria-label="Editar atividade"
                  >
                    <Edit3 size={17} />
                  </button>
                  <button
                    className="icon-button icon-button--danger"
                    onClick={() => onDelete(entry)}
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
        );
      })}
    </section>
  );
}
