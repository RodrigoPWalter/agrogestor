import { History, Search, Sprout } from "lucide-react";

export function PlantingsToolbar({
  view,
  search,
  recordCount,
  onViewChange,
  onSearchChange,
}) {
  return (
    <>
      <div
        className="planting-tabs"
        role="group"
        aria-label="Visualização dos plantios"
      >
        <button
          type="button"
          className={view === "active" ? "is-active" : ""}
          aria-pressed={view === "active"}
          onClick={() => onViewChange("active")}
        >
          <Sprout size={17} /> Plantios ativos
        </button>
        <button
          type="button"
          className={view === "history" ? "is-active" : ""}
          aria-pressed={view === "history"}
          onClick={() => onViewChange("history")}
        >
          <History size={17} /> Histórico de safras
        </button>
      </div>

      <div className="toolbar">
        <label className="search-box">
          <Search size={19} />
          <span className="sr-only">Buscar plantios</span>
          <input
            type="search"
            value={search}
            onChange={onSearchChange}
            placeholder="Buscar por cultura, safra ou variedade"
          />
        </label>
        <span className="record-count">
          {recordCount} {recordCount === 1 ? "registro" : "registros"}
        </span>
      </div>
    </>
  );
}
