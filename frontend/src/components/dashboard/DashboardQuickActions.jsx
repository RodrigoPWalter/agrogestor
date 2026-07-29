import {
  ArrowRight,
  BookOpenText,
  ReceiptText,
  Sprout,
  Warehouse,
} from "lucide-react";
import { Link } from "react-router-dom";

const actions = [
  {
    to: "/plantios",
    icon: Sprout,
    iconClassName: "quick-action__icon--green",
    title: "Gerenciar plantios",
    description: "Cadastre e acompanhe as safras",
  },
  {
    to: "/gastos",
    icon: ReceiptText,
    iconClassName: "quick-action__icon--blue",
    title: "Registrar gasto",
    description: "Controle custos por plantio",
  },
  {
    to: "/estoque",
    icon: Warehouse,
    iconClassName: "quick-action__icon--gold",
    title: "Atualizar estoque",
    description: "Acompanhe entradas e baixas de produtos",
  },
  {
    to: "/diario",
    icon: BookOpenText,
    iconClassName: "quick-action__icon--green",
    title: "Atualizar diário",
    description: "Registre acontecimentos da propriedade",
  },
];

export function DashboardQuickActions() {
  return (
    <section className="panel">
      <div className="panel__header">
        <div>
          <span className="eyebrow">Acesso rápido</span>
          <h2>Atalhos de trabalho</h2>
        </div>
      </div>

      <div className="quick-actions">
        {actions.map(
          ({ to, icon: Icon, iconClassName, title, description }) => (
            <Link to={to} className="quick-action" key={to}>
              <span className={`quick-action__icon ${iconClassName}`}>
                <Icon />
              </span>
              <div>
                <strong>{title}</strong>
                <small>{description}</small>
              </div>
              <ArrowRight size={19} />
            </Link>
          ),
        )}
      </div>
    </section>
  );
}
