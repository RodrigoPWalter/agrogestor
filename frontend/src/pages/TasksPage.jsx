import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Plus,
  Search,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { useConfirmation } from "../components/ConfirmationProvider";
import {
  EmptyState,
  ErrorBanner,
  LoadingState,
  OfflineDataState,
  SuccessBanner,
} from "../components/Feedback";
import { PageHeader } from "../components/PageHeader";
import { TaskCard } from "../components/tasks/TaskCard";
import { TaskFormModal } from "../components/tasks/TaskFormModal";
import { useOfflineRefresh } from "../hooks/useOfflineRefresh";
import { useSingleFlight } from "../hooks/useSingleFlight";
import { mutationFeedback } from "../offline/offlineFeedback";
import { isOfflineResult } from "../offline/offlineSync";

export function TasksPage() {
  const requestConfirmation = useConfirmation();
  const [tab, setTab] = useState("open");
  const [tasks, setTasks] = useState([]);
  const [plantings, setPlantings] = useState([]);
  const [machines, setMachines] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [offlineDataUnavailable, setOfflineDataUnavailable] = useState(false);
  const [editing, setEditing] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { pending: saving, run: runSaving } = useSingleFlight();

  const loadTasks = useCallback(
    async ({ showLoading = true } = {}) => {
      if (showLoading) setLoading(true);
      try {
        const page = await api.getTasks(
          tab === "open" ? { openOnly: true } : { status: "COMPLETED" },
        );
        setTasks(page.content || []);
        setOfflineDataUnavailable(false);
        setError("");
      } catch (requestError) {
        setOfflineDataUnavailable(Boolean(requestError.offlineCacheMiss));
        setError(requestError.offlineCacheMiss ? "" : requestError.message);
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [tab],
  );

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    Promise.all([api.getAllPlantings(), api.getMachines()])
      .then(([plantingPage, machineItems]) => {
        setPlantings(plantingPage.content || []);
        setMachines(machineItems || []);
      })
      .catch(() => {});
  }, []);

  useOfflineRefresh(() => loadTasks({ showLoading: false }));

  const filteredTasks = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    if (!term) return tasks;
    return tasks.filter((task) =>
      [task.title, task.categoryLabel, task.plantingLabel, task.machineLabel]
        .filter(Boolean)
        .some((value) => value.toLocaleLowerCase("pt-BR").includes(term)),
    );
  }, [search, tasks]);

  const summary = useMemo(
    () => ({
      urgent: tasks.filter((task) =>
        ["URGENT", "OVERDUE"].includes(task.urgency),
      ).length,
      attention: tasks.filter((task) => task.urgency === "ATTENTION").length,
      total: tasks.length,
    }),
    [tasks],
  );

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(task) {
    setEditing(task);
    setModalOpen(true);
  }

  async function saveTask(payload) {
    await runSaving(async () => {
      try {
        const result = editing
          ? await api.updateTask(editing.id, payload)
          : await api.createTask(payload);
        setSuccess(
          mutationFeedback(
            result,
            editing ? "Tarefa atualizada." : "Tarefa adicionada.",
          ),
        );
        setModalOpen(false);
        if (!isOfflineResult(result)) await loadTasks({ showLoading: false });
      } catch (requestError) {
        setError(requestError.message);
      }
    });
  }

  async function changeStatus(task, status) {
    try {
      const result = await api.updateTaskStatus(task.id, status);
      const message =
        status === "COMPLETED"
          ? "Tarefa concluída."
          : status === "IN_PROGRESS"
            ? "Tarefa iniciada."
            : "Tarefa reaberta.";
      setSuccess(mutationFeedback(result, message));
      if (!isOfflineResult(result)) await loadTasks({ showLoading: false });
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function remove(task) {
    const confirmed = await requestConfirmation({
      title: "Excluir tarefa?",
      description: `“${task.title}” será removida da lista.`,
      confirmLabel: "Excluir tarefa",
    });
    if (!confirmed) return;
    try {
      const result = await api.deleteTask(task.id);
      setSuccess(mutationFeedback(result, "Tarefa excluída."));
      if (!isOfflineResult(result)) await loadTasks({ showLoading: false });
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <div className="page tasks-page">
      <PageHeader
        eyebrow="Organização da propriedade"
        title="Lista de tarefas"
        description="Planeje os serviços e deixe o AgroGestor avisar quando a urgência aumentar."
        action={
          <button className="button button--primary" onClick={openCreate}>
            <Plus size={18} /> Nova tarefa
          </button>
        }
      />
      <ErrorBanner message={error} onDismiss={() => setError("")} />
      <SuccessBanner message={success} onDismiss={() => setSuccess("")} />

      {tab === "open" && !offlineDataUnavailable && (
        <section className="task-summary" aria-label="Resumo das tarefas">
          <article>
            <ClipboardList size={20} />
            <span>
              <strong>{summary.total}</strong>
              <small>Em aberto</small>
            </span>
          </article>
          <article className="task-summary__attention">
            <AlertTriangle size={20} />
            <span>
              <strong>{summary.attention}</strong>
              <small>Pedem atenção</small>
            </span>
          </article>
          <article className="task-summary__urgent">
            <AlertTriangle size={20} />
            <span>
              <strong>{summary.urgent}</strong>
              <small>Urgentes ou atrasadas</small>
            </span>
          </article>
        </section>
      )}

      <section className="tasks-toolbar">
        <div className="segmented-control">
          <button
            className={tab === "open" ? "is-active" : ""}
            onClick={() => setTab("open")}
          >
            Em aberto
          </button>
          <button
            className={tab === "completed" ? "is-active" : ""}
            onClick={() => setTab("completed")}
          >
            <CheckCircle2 size={16} /> Concluídas
          </button>
        </div>
        <label className="search-field">
          <Search size={18} />
          <input
            aria-label="Pesquisar tarefas"
            placeholder="Pesquisar tarefa"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
      </section>

      {offlineDataUnavailable ? (
        <OfflineDataState onRetry={() => loadTasks()} />
      ) : loading ? (
        <LoadingState label="Organizando as tarefas..." />
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          title={
            search
              ? "Nenhuma tarefa encontrada"
              : tab === "open"
                ? "Nenhuma tarefa pendente"
                : "Nenhuma tarefa concluída"
          }
          description={
            search
              ? "Tente outro termo de pesquisa."
              : tab === "open"
                ? "Cadastre um serviço para acompanhar o prazo sem depender da memória."
                : "As tarefas finalizadas aparecerão aqui."
          }
          action={
            !search && tab === "open" ? (
              <button className="button button--primary" onClick={openCreate}>
                <Plus size={18} /> Cadastrar tarefa
              </button>
            ) : null
          }
        />
      ) : (
        <section className="task-list">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              busy={saving}
              onEdit={openEdit}
              onDelete={remove}
              onStatusChange={changeStatus}
            />
          ))}
        </section>
      )}

      {modalOpen && (
        <TaskFormModal
          task={editing}
          plantings={plantings}
          machines={machines}
          saving={saving}
          onSave={saveTask}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
