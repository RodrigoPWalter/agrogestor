import {
  Eye,
  EyeOff,
  Leaf,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sprout,
} from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export function LoginPage() {
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setCredentials((current) => ({ ...current, [name]: value }));
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await login(credentials);
      const destination = location.state?.from || "/";
      navigate(destination, { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-introduction" aria-label="Sobre o AgroGestor">
        <div className="login-brand">
          <span>
            <Leaf size={25} />
          </span>
          <strong>AgroGestor</strong>
        </div>

        <div className="login-introduction__content">
          <span className="login-eyebrow">
            <Sprout size={15} />
            Gestão rural em um só lugar
          </span>
          <h1>Decisões mais claras para cada etapa da safra.</h1>
          <p>
            Acompanhe plantios, estoque, custos e operações da propriedade com
            seus dados protegidos em uma área de acesso exclusivo.
          </p>
        </div>

        <div className="login-security-note">
          <ShieldCheck size={18} />
          <span>
            <strong>Ambiente protegido</strong>
            Sua sessão é validada a cada acesso à API.
          </span>
        </div>
      </section>

      <section className="login-access">
        <div className="login-card">
          <header>
            <span className="login-card__mark">
              <Leaf size={22} />
            </span>
            <p>Acesso à propriedade</p>
            <h2>Entre na sua conta</h2>
            <small>Use o e-mail e a senha cadastrados no AgroGestor.</small>
          </header>

          <form className="login-form" onSubmit={handleSubmit}>
            <label htmlFor="login-email">E-mail</label>
            <div className="login-input">
              <Mail size={17} />
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="seuemail@exemplo.com"
                value={credentials.email}
                onChange={handleChange}
                required
                autoFocus
              />
            </div>

            <label htmlFor="login-password">Senha</label>
            <div className="login-input">
              <LockKeyhole size={17} />
              <input
                id="login-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Digite sua senha"
                value={credentials.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>

            {error && (
              <div className="login-error" role="alert">
                {error}
              </div>
            )}

            <button
              className="login-submit"
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Verificando acesso..." : "Entrar no AgroGestor"}
            </button>
          </form>

          <footer>
            <ShieldCheck size={14} />
            Acesso protegido por autenticação com token.
          </footer>
        </div>
      </section>
    </main>
  );
}
