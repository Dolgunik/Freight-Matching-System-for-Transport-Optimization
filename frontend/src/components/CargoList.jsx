import { Clock, PackageCheck } from "lucide-react";

import { formatShortDateTime } from "../utils/date.js";

export default function CargoList({ cargo, isLoading }) {
  if (isLoading) {
    return <p className="empty-state">Loading cargo...</p>;
  }

  return (
    <div className="cargo-list">
      {cargo.map((item) => (
        <article key={item.id} className="list-card">
          <div className="list-card-header">
            <div>
              <h3>{item.name}</h3>
              <p>
                {item.pickupCity.name} to {item.destinationCity.name}
              </p>
            </div>
            <span className={`tag ${item.status === "ready_for_loading" ? "success" : "neutral"}`}>
              {item.status}
            </span>
          </div>
          <div className="meta-row">
            <span>
              <PackageCheck size={15} aria-hidden="true" />
              {item.weightKg.toLocaleString()} kg
            </span>
            <span>
              <Clock size={15} aria-hidden="true" />
              until {formatShortDateTime(item.pickupWindowEnd)}
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}
