import {
  BadgeDollarSign,
  CloudRain,
  FlaskConical,
  PackagePlus,
  Plus,
  Sprout,
  Tractor,
  Wheat,
} from "lucide-react";

const primaryActions = [
  {
    type: "EXPENSE",
    label: "Gasto",
    description: "Valor pago",
    icon: BadgeDollarSign,
    tone: "gold",
  },
  {
    type: "PRODUCT_PURCHASE",
    label: "Compra",
    description: "Entrada no estoque",
    icon: PackagePlus,
    tone: "green",
  },
  {
    type: "PRODUCT_USE",
    label: "Uso de produto",
    description: "Baixa no estoque",
    icon: FlaskConical,
    tone: "blue",
  },
  {
    type: "RAIN",
    label: "Chuva",
    description: "Milímetros medidos",
    icon: CloudRain,
    tone: "blue",
  },
  {
    type: "PLANTING",
    label: "Plantio",
    description: "Hectares semeados",
    icon: Sprout,
    tone: "green",
  },
  {
    type: "HARVEST",
    label: "Colheita",
    description: "Área e produção",
    icon: Wheat,
    tone: "gold",
  },
];

export function DiaryQuickLaunch({ onSelect, onMore }) {
  return (
    <section
      className="diary-quick-launch"
      aria-labelledby="quick-launch-title"
    >
      <header className="diary-quick-launch__header">
        <div>
          <span className="eyebrow">Lançamento rápido</span>
          <h2 id="quick-launch-title">O que aconteceu hoje?</h2>
          <p>Escolha uma opção e preencha somente o necessário.</p>
        </div>
        <button
          type="button"
          className="button button--ghost diary-quick-launch__more"
          onClick={onMore}
        >
          <Plus size={17} /> Mais opções
        </button>
      </header>

      <div className="diary-quick-launch__grid">
        {primaryActions.map(
          ({ type, label, description, icon: Icon, tone }) => (
            <button
              key={type}
              type="button"
              className="diary-launch-action"
              onClick={() => onSelect(type)}
              aria-label={`Registrar ${label.toLowerCase()}`}
            >
              <span
                className={`diary-launch-action__icon diary-launch-action__icon--${tone}`}
              >
                <Icon size={22} />
              </span>
              <span>
                <strong>{label}</strong>
                <small>{description}</small>
              </span>
            </button>
          ),
        )}
      </div>

      <button
        type="button"
        className="diary-quick-launch__mobile-more"
        onClick={onMore}
      >
        <Tractor size={18} /> Manutenção, venda, observação ou outro
      </button>
    </section>
  );
}
