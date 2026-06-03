/**
 * Renders the static city graph and lets the user choose the city used by the cargo panel.
 */
export default function CityMap({ cities, routes, selectedTruck, cargo, selectedCityId, onSelectCity }) {
  const cityById = new Map(cities.map((city) => [city.id, city]));
  const selectedTruckCityId = selectedTruck?.isMoving
    ? selectedTruck?.arrivalCityId
    : selectedTruck?.parkingCityId;
  const cargoCityIds = new Set(cargo.flatMap((item) => [item.pickupCityId, item.destinationCityId]));

  return (
    <div className="city-map" aria-label="Static city map">
      <svg viewBox="0 0 100 100" role="img" aria-label="Finland freight city network">
        <rect x="4" y="4" width="92" height="92" rx="6" className="map-land" />
        {routes.map((route) => {
          const fromCity = cityById.get(route.fromCityId);
          const toCity = cityById.get(route.toCityId);

          if (!fromCity || !toCity || route.fromCityId > route.toCityId) {
            return null;
          }

          return (
            <line
              key={`${route.fromCityId}-${route.toCityId}`}
              x1={fromCity.mapX}
              y1={fromCity.mapY}
              x2={toCity.mapX}
              y2={toCity.mapY}
              className="route-line"
            />
          );
        })}

        {cities.map((city) => {
          const isTruckCity = city.id === selectedTruckCityId;
          const isFocusedCity = city.id === selectedCityId;
          const hasCargo = cargoCityIds.has(city.id);
          const dotClassName = [
            "city-dot",
            isTruckCity ? "selected" : "",
            isFocusedCity ? "focused" : "",
            hasCargo ? "cargo" : ""
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <g
              key={city.id}
              className="city-node"
              role="button"
              tabIndex="0"
              onClick={() => onSelectCity(city.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  onSelectCity(city.id);
                }
              }}
            >
              <circle
                cx={city.mapX}
                cy={city.mapY}
                r={isTruckCity || isFocusedCity ? 3.4 : 2.6}
                className={dotClassName}
              />
              <text x={city.mapX + 3.4} y={city.mapY - 2.8}>
                {city.name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
