import { BookOpenText } from "lucide-react";

export function DiaryFilter({
  plantings,
  selectedPlantingId,
  entryCount,
  onChange,
}) {
  return (
    <section className="diary-filter">
      <div>
        <span className="eyebrow">Filtrar histórico</span>
        <label>
          <span className="sr-only">Escolher plantio</span>
          <select value={selectedPlantingId} onChange={onChange}>
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
        {entryCount} {entryCount === 1 ? "registro" : "registros"}
      </span>
    </section>
  );
}
