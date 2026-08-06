import { useEffect, useState } from "react";
import { api } from "../api/client";
import { ErrorBanner, LoadingState, SuccessBanner } from "./Feedback";
import { Modal } from "./Modal";

const emptyForm = {
  nome: "",
  email: "",
  senha: "",
  propriedade: "",
};

export function UserManagementModal({ onClose }) {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;
    api
      .getUsers()
      .then((data) => active && setUsers(data))
      .catch((requestError) => active && setError(requestError.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const created = await api.createUser(form);
      setUsers((current) => [...current, created]);
      setForm(emptyForm);
      setSuccess(
        `Conta de ${created.nome} criada com dados separados em “${created.propriedade}”.`,
      );
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title="Contas e propriedades"
      description="Crie uma conta independente para testes ou para outra propriedade."
      onClose={onClose}
      dismissible={!saving}
    >
      <div className="user-management">
        <ErrorBanner message={error} onDismiss={() => setError("")} />
        <SuccessBanner message={success} onDismiss={() => setSuccess("")} />

        <section className="user-management__section">
          <div className="user-management__heading">
            <strong>Contas cadastradas</strong>
            <span>{users.length}</span>
          </div>
          {loading ? (
            <LoadingState label="Carregando contas..." />
          ) : (
            <div className="user-list">
              {users.map((item) => (
                <div key={item.id}>
                  <span>
                    <strong>{item.nome}</strong>
                    <small>{item.email}</small>
                  </span>
                  <span>
                    <strong>{item.propriedade}</strong>
                    <small>
                      {item.role === "ADMIN" ? "Administrador" : "Usuário"}
                    </small>
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <form className="form user-create-form" onSubmit={submit}>
          <div className="user-management__heading">
            <strong>Nova conta independente</strong>
          </div>
          <p className="user-create-form__note">
            Essa conta começará vazia e não terá acesso aos dados da sua
            propriedade principal.
          </p>
          <div className="form-grid">
            <label>
              <span>Nome da pessoa</span>
              <input
                required
                maxLength="120"
                autoComplete="off"
                value={form.nome}
                onChange={(event) => update("nome", event.target.value)}
              />
            </label>
            <label>
              <span>Nome da propriedade</span>
              <input
                required
                maxLength="140"
                autoComplete="off"
                placeholder="Ex.: Fazenda de testes"
                value={form.propriedade}
                onChange={(event) => update("propriedade", event.target.value)}
              />
            </label>
            <label>
              <span>E-mail para entrar</span>
              <input
                required
                type="email"
                maxLength="254"
                autoComplete="off"
                value={form.email}
                onChange={(event) => update("email", event.target.value)}
              />
            </label>
            <label>
              <span>Senha inicial</span>
              <input
                required
                type="password"
                minLength="8"
                maxLength="72"
                autoComplete="new-password"
                placeholder="Mínimo de 8 caracteres"
                value={form.senha}
                onChange={(event) => update("senha", event.target.value)}
              />
            </label>
          </div>
          <div className="form-actions">
            <button
              type="button"
              className="button button--ghost"
              onClick={onClose}
              disabled={saving}
            >
              Fechar
            </button>
            <button className="button button--primary" disabled={saving}>
              {saving ? "Criando conta..." : "Criar conta"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
