import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Box, CalendarClock, MapPinned, RefreshCw, Route, Search, Truck } from "lucide-react";

import { api } from "../api.js";
import CargoList from "../components/CargoList.jsx";
import CityMap from "../components/CityMap.jsx";
import MatchResults from "../components/MatchResults.jsx";
import TruckList from "../components/TruckList.jsx";
import { formatDateTime } from "../utils/date.js";

export default function HomePage() {
  const [cities, setCities] = useState([]);
  const [cargo, setCargo] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [systemInfo, setSystemInfo] = useState(null);
  const [selectedTruckId, setSelectedTruckId] = useState(null);
  const [selectedCityId, setSelectedCityId] = useState(null);
  const [matchResults, setMatchResults] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMatching, setIsMatching] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setIsLoading(true);
        const [healthData, cityData, cargoData, truckData, routeData] = await Promise.all([
          api.getHealth(),
          api.getCities(),
          api.getCargo(),
          api.getTrucks(),
          api.getRoutes()
        ]);

        if (!isMounted) {
          return;
        }

        setSystemInfo(healthData);
        setCities(cityData);
        setCargo(cargoData);
        setTrucks(truckData);
        setRoutes(routeData);
        setSelectedTruckId(truckData[0]?.id ?? null);
        setSelectedCityId(cityData.find((city) => city.name === "Vaasa")?.id ?? cityData[0]?.id ?? null);
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedTruck = useMemo(
    () => trucks.find((truck) => truck.id === selectedTruckId) ?? null,
    [selectedTruckId, trucks]
  );
  const selectedCity = useMemo(
    () => cities.find((city) => city.id === selectedCityId) ?? null,
    [cities, selectedCityId]
  );
  const selectedCityRoutes = useMemo(
    () => routes.filter((route) => route.fromCityId === selectedCityId),
    [routes, selectedCityId]
  );

  const handleSelectTruck = (truckId) => {
    const truck = trucks.find((item) => item.id === truckId);

    setSelectedTruckId(truckId);
    setSelectedCityId(truck?.isMoving ? truck.arrivalCityId : truck?.parkingCityId ?? null);
    setMatchResults(null);
  };

  const handleFindMatches = async () => {
    if (!selectedTruckId) {
      return;
    }

    try {
      setError("");
      setIsMatching(true);
      const result = await api.getMatches(selectedTruckId);
      setMatchResults(result);
    } catch (matchError) {
      setError(matchError.message);
    } finally {
      setIsMatching(false);
    }
  };

  return (
    <main className="app-shell">
      <section className="top-bar">
        <div>
          <p className="eyebrow">Freight matching prototype</p>
          <h1>Truck-to-cargo feasibility check</h1>
        </div>
        <div className="status-pill">
          <MapPinned size={18} aria-hidden="true" />
          Finland test network
        </div>
        <div className="status-pill">
          <CalendarClock size={18} aria-hidden="true" />
          {systemInfo ? formatDateTime(systemInfo.matchingReferenceTime) : "Loading time..."}
        </div>
      </section>

      {error ? <div className="error-banner">{error}</div> : null}

      <section className="workspace-grid">
        <div className="map-panel">
          <div className="panel-title">
            <MapPinned size={18} aria-hidden="true" />
            <h2>Cities and static routes</h2>
          </div>
          <CityMap
            cities={cities}
            routes={routes}
            selectedTruck={selectedTruck}
            cargo={cargo}
            selectedCityId={selectedCityId}
            onSelectCity={setSelectedCityId}
          />
        </div>

        <div className="side-column">
          <div className="panel-title">
            <Truck size={18} aria-hidden="true" />
            <h2>Trucks</h2>
          </div>
          <TruckList
            trucks={trucks}
            selectedTruckId={selectedTruckId}
            onSelectTruck={handleSelectTruck}
            isLoading={isLoading}
          />

          <div className="selected-truck">
            <div className="panel-title">
              <RefreshCw size={18} aria-hidden="true" />
              <h2>Selected truck</h2>
            </div>
            {selectedTruck ? (
              <div className="truck-detail-grid">
                <span>Name</span>
                <strong>{selectedTruck.name}</strong>
                <span>Status</span>
                <strong>{selectedTruck.status}</strong>
                <span>Capacity</span>
                <strong>{selectedTruck.capacityKg.toLocaleString()} kg</strong>
                <span>State</span>
                <strong>
                  {selectedTruck.isMoving
                    ? `Moving to ${selectedTruck.arrivalCity?.name ?? "unknown"}`
                    : `Parked in ${selectedTruck.parkingCity?.name ?? "unknown"}`}
                </strong>
              </div>
            ) : (
              <p className="empty-state">No truck selected</p>
            )}
            <button
              className="primary-action"
              type="button"
              onClick={handleFindMatches}
              disabled={!selectedTruckId || isMatching}
            >
              <Search size={18} aria-hidden="true" />
              {isMatching ? "Checking..." : "Find matches"}
            </button>
          </div>
        </div>
      </section>

      <section className="data-grid">
        <div>
          <div className="panel-title panel-title-between">
            <div className="panel-title">
              <Box size={18} aria-hidden="true" />
              <h2>{selectedCity ? `${selectedCity.name} cargo` : "Cargo"}</h2>
            </div>
            {selectedCity ? (
              <span className="status-pill compact">
                <Route size={15} aria-hidden="true" />
                {selectedCityRoutes.length} routes
              </span>
            ) : null}
          </div>
          <CargoList cargo={cargo} selectedCity={selectedCity} isLoading={isLoading} />
        </div>

        <div>
          <div className="panel-title">
            <ArrowRight size={18} aria-hidden="true" />
            <h2>Matching results</h2>
          </div>
          <MatchResults results={matchResults} selectedCity={selectedCity} isLoading={isMatching} />
        </div>
      </section>
    </main>
  );
}
