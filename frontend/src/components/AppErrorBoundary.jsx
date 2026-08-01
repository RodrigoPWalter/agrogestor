import { Component } from "react";
import { RefreshCw, TriangleAlert } from "lucide-react";

export class AppErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  retry = () => {
    if (this.props.onRetry) {
      this.props.onRetry();
      return;
    }

    window.location.reload();
  };

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <div className="page page--loading">
        <section className="state-box state-box--error" role="alert">
          <span className="state-box__icon">
            <TriangleAlert size={30} />
          </span>
          <h2>Não foi possível abrir esta tela</h2>
          <p>
            A conexão pode ter oscilado ou o aplicativo pode ter recebido uma
            atualização. Seus dados já salvos continuam seguros.
          </p>
          <button className="button button--primary" onClick={this.retry}>
            <RefreshCw size={17} /> Recarregar AgroGestor
          </button>
        </section>
      </div>
    );
  }
}
