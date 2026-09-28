import { CalendarDays, CheckCircle2, ListChecks } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import { useOfflineRefresh } from "../../hooks/useOfflineRefresh";
import { formatDate } from "../../utils/formatters";

export function TaskAttentionPanel() {
  const [tasks, setTasks] = useState([]);

  const loadTasks = useCallback(() => {
    api
      .getTasks({ openOnly: true })
      .then((page) => setTasks((page.content || []).slice(0, 4)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useOfflineRefresh(loadTasks);

  return (
    <section className="panel dashboard-task-panel">
      <div className="panel__header">
        <div>
          <span className="eyebrow">Próximos serviços</span>
          <h2>Tarefas da propriedade</h2>
        </div>
        <Link to="/tarefas">Ver tarefas</Link>
      </div>
      {tasks.length === 0 ? (
        <div className="dashboard-task-panel__empty">
          <CheckCircle2 size={20} />
          <span>Nenhuma tarefa pendente no momento.</span>
          <Link to="/tarefas">Planejar tarefa</Link>
        </div>
      ) : (
        <div className="dashboard-task-list">
          {tasks.map((task) => (
            <Link key={task.id} to="/tarefas" className="dashboard-task-item">
              <span
                className={`task-urgency task-urgency--${task.urgency.toLowerCase()}`}
              >
                {task.urgencyLabel}
              </span>
              <div>
                <strong>
                  <ListChecks size={15} /> {task.title}
                </strong>
                <small>
                  <CalendarDays size={13} /> Prazo: {formatDate(task.dueDate)}
                </small>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
