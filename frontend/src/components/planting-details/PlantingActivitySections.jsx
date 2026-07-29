import { BookOpenText, CloudRain } from "lucide-react";
import { formatDate } from "../../utils/formatters";

export function PlantingActivitySections({ diary, rainfall }) {
  return (
    <div className="planting-detail__columns">
      <section>
        <h3>
          <BookOpenText size={17} /> Diário e observações
        </h3>
        {diary.slice(0, 4).map((item) => (
          <p key={item.id}>
            <strong>{item.activityTypeName}:</strong> {item.activity}
          </p>
        ))}
        {!diary.length && (
          <p className="muted-copy">Sem lançamentos no diário.</p>
        )}
      </section>
      <section>
        <h3>
          <CloudRain size={17} /> Chuvas registradas
        </h3>
        {rainfall.slice(0, 4).map((item) => (
          <p key={item.id}>
            {formatDate(item.measurementDate)} ·{" "}
            <strong>{item.millimeters} mm</strong>
          </p>
        ))}
        {!rainfall.length && <p className="muted-copy">Sem chuva vinculada.</p>}
      </section>
    </div>
  );
}
