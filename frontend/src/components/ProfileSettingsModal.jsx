import { useState } from "react";
import { ErrorBanner, SuccessBanner } from "./Feedback";
import { Modal } from "./Modal";

export function ProfileSettingsModal({ user, onClose, onSave }) {
  const [form, setForm] = useState({
    nome: user.nome,
    email: user.email,
    senhaAtual: "",
    novaSenha: "",
    confirmarSenha: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (form.novaSenha && form.novaSenha !== form.confirmarSenha) {
      setError("A confirmação da nova senha não confere.");
      return;
    }

    setSaving(true);
    try {
      await onSave({
        nome: form.nome,
        email: form.email,
        senhaAtual: form.senhaAtual,
        novaSenha: form.novaSenha || null,
      });
      setForm((current) => ({
        ...current,
        senhaAtual: "",
        novaSenha: "",
        confirmarSenha: "",
      }));
      setSuccess("Dados de acesso atualizados.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title="Minha conta"
      description="Altere o nome, o e-mail usado no login ou a senha."
      onClose={onClose}
    >
      <form className="form profile-settings-form" onSubmit={submit}>
        <ErrorBanner message={error} onDismiss={() => setError("")} />
        <SuccessBanner message={success} onDismiss={() => setSuccess("")} />
        <div className="form-grid">
          <label>
            <span>Nome exibido</span>
            <input
              required
              maxLength="120"
              autoComplete="name"
              value={form.nome}
              onChange={(event) => update("nome", event.target.value)}
            />
          </label>
          <label>
            <span>E-mail para entrar</span>
            <input
              required
              type="email"
              maxLength="254"
              autoComplete="username"
              value={form.email}
              onChange={(event) => update("email", event.target.value)}
            />
          </label>
          <label className="form-grid__full">
            <span>Senha atual</span>
            <input
              required
              type="password"
              maxLength="72"
              autoComplete="current-password"
              value={form.senhaAtual}
              onChange={(event) => update("senhaAtual", event.target.value)}
            />
          </label>
          <label>
            <span>
              Nova senha <small>(opcional)</small>
            </span>
            <input
              type="password"
              minLength="8"
              maxLength="72"
              autoComplete="new-password"
              value={form.novaSenha}
              onChange={(event) => update("novaSenha", event.target.value)}
              placeholder="Mínimo de 8 caracteres"
            />
          </label>
          <label>
            <span>Confirmar nova senha</span>
            <input
              type="password"
              minLength={form.novaSenha ? 8 : undefined}
              maxLength="72"
              autoComplete="new-password"
              value={form.confirmarSenha}
              onChange={(event) => update("confirmarSenha", event.target.value)}
              disabled={!form.novaSenha}
            />
          </label>
        </div>
        <p className="profile-settings-form__note">
          Para sua segurança, a senha atual sempre será solicitada.
        </p>
        <div className="form-actions">
          <button
            type="button"
            className="button button--ghost"
            onClick={onClose}
          >
            Fechar
          </button>
          <button className="button button--primary" disabled={saving}>
            {saving ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
