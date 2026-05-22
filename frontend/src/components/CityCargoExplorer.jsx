import { MapPin, PackageCheck, Route } from "lucide-react";

import { formatShortDateTime } from "../utils/date.js";

function CargoMiniCard({ item, direction }) {
  return (
    <article className="city-cargo-card">
      <div>
        <h3>{item.name}</h3>
        <p>
          {direction === "pickup"
            ? `To ${item.destinationCity.name}`
            : `From ${item.pickupCity.name}`}
        </p>
      </div>
      <div className="city-cargo-meta">
        <span>
          <PackageCheck size={14} aria-hidden="true" />
          {item.weightKg.toLocaleString()} kg
        </span>
        <span>{formatShortDateTime(item.pickupWindowEnd)}</span>
      </div>
      <span className={`tag ${item.status === "ready_for_loading" ? "success" : "neutral"}`}>
        {item.status}
      </span>
    </article>
  );
}

export default function CityCargoExplorer({
  cities,
  cargo,
  routes,
  selectedCityId,
  onSelectCity,
  isLoading
}) {
  const selectedCity = cities.find((city) => city.id === selectedCityId) ?? cities[0] ?? null;
  const pickupCargo = selectedCity
    ? cargo.filter((item) => item.pickupCityId === selectedCity.id)
    : [];
  const destinationCargo = selectedCity
    ? cargo.filter((item) => item.destinationCityId === selectedCity.id)
    : [];
  const outgoingRoutes = selectedCity
    ? routes.filter((route) => route.fromCityId === selectedCity.id)
    : [];

  if (isLoading) {
    return <p className="empty-state">Loading city cargo...</p>;
  }

  if (!selectedCity) {
    return <p className="empty-state">No cities available.</p>;
  }

  return (
    <div className="city-explorer">
      <div className="city-selector" aria-label="Cities">
        {cities.map((city) => (
          <button
            key={city.id}
            type="button"
            className={city.id === selectedCity.id ? "city-button selected" : "city-button"}
            onClick={() => onSelectCity(city.id)}
          >
            <MapPin size={15} aria-hidden="true" />
            {city.name}
          </button>
        ))}
      </div>

      <div className="city-detail">
        <div className="city-detail-header">
          <div>
            <h3>{selectedCity.name}</h3>
            <p>{selectedCity.country}</p>
          </div>
          <span className="status-pill compact">
            <Route size={15} aria-hidden="true" />
            {outgoingRoutes.length} routes
          </span>
        </div>

        <div className="city-cargo-columns">
          <section>
            <h3>Pickup cargo</h3>
            {pickupCargo.length ? (
              pickupCargo.map((item) => (
                <CargoMiniCard key={item.id} item={item} direction="pickup" />
              ))
            ) : (
              <p className="empty-state compact">No pickup cargo in this city.</p>
            )}
          </section>

          <section>
            <h3>Destination cargo</h3>
            {destinationCargo.length ? (
              destinationCargo.map((item) => (
                <CargoMiniCard key={item.id} item={item} direction="destination" />
              ))
            ) : (
              <p className="empty-state compact">No destination cargo in this city.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

