export function PlantingProgressBar({
  percentage,
  statusName,
  compact = false,
  ariaLabel = "Progresso da área plantada",
}) {
  const normalizedPercentage = Math.min(
    100,
    Math.max(0, Number(percentage) || 0),
  );

  return (
    <div
      className={`planting-progress ${compact ? "planting-progress--compact" : ""}`}
    >
      <div
        className="planting-progress__track"
        role="progressbar"
        aria-label={ariaLabel}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={Math.round(normalizedPercentage)}
      >
        <span style={{ width: `${normalizedPercentage}%` }} />
      </div>
      <div className="planting-progress__caption">
        <span>{statusName}</span>
        <strong>
          {normalizedPercentage.toLocaleString("pt-BR", {
            maximumFractionDigits: 2,
          })}
          %
        </strong>
      </div>
    </div>
  );
}
