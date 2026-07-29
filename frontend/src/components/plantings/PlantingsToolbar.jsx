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
      <div className="planting-tabs">
        <button
          className={view === "active" ? "is-active" : ""}
          onClick={() => onViewChange("active")}
        >
          <Sprout size={17} /> Plantios ativos
        </button>
        <button
          className={view === "history" ? "is-active" : ""}
          onClick={() => onViewChange("history")}
        >
          <History size={17} /> Histórico de safras
        </button>
      </div>

      <div className="toolbar">
        <label className="search-box">
          <Search size={19} />
          <input
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
