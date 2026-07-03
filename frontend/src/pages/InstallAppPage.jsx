import {
  CheckCircle2,
  Download,
  MoreVertical,
  PlusSquare,
  Share,
  Smartphone,
} from "lucide-react";
import { PageHeader } from "../components/PageHeader";

const androidSteps = [
  "Abra o AgroGestor no Google Chrome.",
  'Toque no menu de três pontos e escolha "Instalar app" ou "Adicionar à tela inicial".',
  'Confirme em "Instalar". O ícone aparecerá junto dos outros aplicativos.',
];

const iphoneSteps = [
  "Abra o AgroGestor no Safari.",
  "Toque no botão Compartilhar, na barra inferior do navegador.",
  'Escolha "Adicionar à Tela de Início" e confirme em "Adicionar".',
];

function InstallationGuide({ icon: Icon, title, browser, steps }) {
  return (
    <article className="install-guide">
      <header>
        <span>
          <Icon size={22} />
        </span>
        <div>
          <h2>{title}</h2>
          <p>{browser}</p>
        </div>
      </header>
      <ol>
        {steps.map((step, index) => (
          <li key={step}>
            <span>{index + 1}</span>
            <p>{step}</p>
          </li>
        ))}
      </ol>
    </article>
  );
}

export function InstallAppPage() {
  return (
    <div className="page install-app-page">
      <PageHeader
        eyebrow="Aplicativo no celular"
        title="Instale o AgroGestor"
        description="Use o sistema em tela cheia e abra-o diretamente pelo ícone na tela inicial do celular."
      />

      <section className="install-intro">
        <span>
          <Download size={28} />
        </span>
        <div>
          <h2>Não é necessário baixar pela loja</h2>
          <p>
            A instalação é feita pelo próprio navegador. O AgroGestor continuará
            usando a internet para acessar e atualizar os dados da propriedade.
          </p>
        </div>
      </section>

      <section className="install-guides" aria-label="Instruções de instalação">
        <InstallationGuide
          icon={MoreVertical}
          title="Android"
          browser="Google Chrome"
          steps={androidSteps}
        />
        <InstallationGuide
          icon={Share}
          title="iPhone"
          browser="Safari"
          steps={iphoneSteps}
        />
      </section>

      <section className="install-result">
        <Smartphone size={24} />
        <div>
          <h2>Depois de instalar</h2>
          <p>
            Procure o ícone verde e amarelo do AgroGestor na tela inicial. Ao
            abrir, o sistema será exibido como um aplicativo, sem a barra do
            navegador.
          </p>
        </div>
        <span>
          <CheckCircle2 size={17} />
          Pronto para usar
        </span>
      </section>

      <p className="install-tip">
        <PlusSquare size={16} />
        No iPhone, a opção de instalação está disponível pelo Safari.
      </p>
    </div>
  );
}
