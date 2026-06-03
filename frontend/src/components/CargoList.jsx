import { Clock, PackageCheck } from "lucide-react";

import { formatShortDateTime } from "../utils/date.js";

const getStatusLabel = (status) => (status === "ready_for_loading" ? "ready" : status);

/**
 * Compact one-line cargo row used for both outgoing and incoming city cargo.
 */
function CargoRow({ item, direction }) {
  return (
    <article className="list-card compact-cargo-row">
      <strong>{item.name}</strong>
      <span>
        {direction === "pickup"
          ? `To ${item.destinationCity.name}`
          : `From ${item.pickupCity.name}`}
      </span>
      <span>
        <PackageCheck size={14} aria-hidden="true" />
        {item.weightKg.toLocaleString()} kg
      </span>
      <span>
        <Clock size={14} aria-hidden="true" />
        {formatShortDateTime(item.pickupWindowEnd)}
      </span>
      <span
        className={`tag ${item.status === "ready_for_loading" ? "success" : "neutral"}`}
        title={item.status}
      >
        {getStatusLabel(item.status)}
      </span>
    </article>
  );
}

/**
 * Shows cargo related to the selected city.
 * Outgoing cargo is listed separately from cargo delivered into the same city.
 */
export default function CargoList({ cargo, selectedCity, isLoading }) {
  if (isLoading) {
    return <p className="empty-state">Loading cargo...</p>;
  }

  if (!selectedCity) {
    return <p className="empty-state">Select a city on the map or choose a truck.</p>;
  }

  const pickupCargo = cargo.filter((item) => item.pickupCityId === selectedCity.id);
  const destinationCargo = cargo.filter((item) => item.destinationCityId === selectedCity.id);

  return (
    <div className="cargo-list">
      <div className="cargo-list-divider">
        <span>Available from this city</span>
      </div>
      {pickupCargo.length ? (
        pickupCargo.map((item) => <CargoRow key={`pickup-${item.id}`} item={item} direction="pickup" />)
      ) : (
        <p className="empty-state compact">No cargo available from this city.</p>
      )}

      <div className="cargo-list-divider delivered">
        <span>Delivered to this city</span>
      </div>
      {destinationCargo.length ? (
        destinationCargo.map((item) => (
          <CargoRow key={`destination-${item.id}`} item={item} direction="destination" />
        ))
      ) : (
        <p className="empty-state compact">No cargo delivered to this city.</p>
      )}
    </div>
  );
}
