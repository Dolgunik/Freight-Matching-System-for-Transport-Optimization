import { CheckCircle2, Link2, RefreshCw, XCircle } from "lucide-react";

import { formatShortDateTime } from "../utils/date.js";

const formatDuration = (minutes) => {
  if (minutes == null) {
    return "n/a";
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes} min`;
  }

  return `${hours}h ${remainingMinutes}m`;
};

/**
 * Displays one continuous chain or repeatable cargo cycle returned by the backend.
 */
function ChainCard({ chain, variant }) {
  const Icon = variant === "cycle" ? RefreshCw : Link2;
  const cycleLabel = chain.cycleStartsWithCargoName
    ? `repeats: ${chain.cycleStartsWithCargoName}`
    : `cycle: ${chain.cycleCity}`;

  return (
    <article className={`chain-card ${variant}`}>
      <div className="chain-header">
        <div>
          <h3>{chain.cityPath.join(" -> ")}</h3>
          <p>
            {chain.cargoCount} cargo legs, travel {formatDuration(chain.totalTravelMinutes)}
          </p>
        </div>
        <span className={`tag ${variant === "cycle" ? "neutral" : "success"}`}>
          <Icon size={14} aria-hidden="true" />
          {variant === "cycle" ? cycleLabel : "longest"}
        </span>
      </div>
      {variant === "cycle" && chain.cycleReason ? (
        <p className="chain-note">{chain.cycleReason}</p>
      ) : null}
      <div className="chain-leg-list">
        {chain.legs.map((leg, index) => (
          <div key={`${chain.id}-${leg.cargoId}`} className="chain-leg-row">
            <strong>{index + 1}</strong>
            <span>{leg.cargoName}</span>
            <span>
              {leg.pickupCity}
              {" -> "}
              {leg.destinationCity}
            </span>
            <span>{formatShortDateTime(leg.deliveryArrivalTime)}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

/**
 * Displays one single-cargo match or rejection with backend reasons.
 */
function ResultCard({ item, variant }) {
  const Icon = variant === "match" ? CheckCircle2 : XCircle;

  return (
    <article className={`result-card ${variant} compact-result-card`}>
      <div className="compact-result-row">
        <Icon size={17} aria-hidden="true" />
        <strong>{item.cargoName}</strong>
        <span>
          {item.pickupCity}
          {" -> "}
          {item.destinationCity}
        </span>
        <span>{item.weightKg.toLocaleString()} kg</span>
        <span>{formatShortDateTime(item.deliveryArrivalTime)}</span>
      </div>
      <p className="compact-reasons">{item.reasons.join(" | ")}</p>
    </article>
  );
}

/**
 * Renders backend matching output and keeps rejected cargo scoped to the selected city.
 */
export default function MatchResults({ results, selectedCity, isLoading }) {
  if (isLoading) {
    return <p className="empty-state">Checking feasible cargo...</p>;
  }

  if (!results) {
    return <p className="empty-state">Select a truck and run matching.</p>;
  }

  const rejectedForSelectedCity = selectedCity
    ? results.rejected.filter((item) => item.pickupCityId === selectedCity.id)
    : results.rejected;
  const rejectedTitle = selectedCity
    ? `Rejected cargo from ${selectedCity.name} (${rejectedForSelectedCity.length})`
    : `Rejected cargo (${rejectedForSelectedCity.length})`;

  return (
    <div className="match-results">
      <div className="match-summary">
        <strong>{results.truck.name}</strong>
        <span>calculation time: {formatShortDateTime(results.matchingReferenceTime)}</span>
        <span>
          effective city: {results.truck.effectiveCity}, time: {formatShortDateTime(results.truck.effectiveTime)}
        </span>
      </div>

      <div className="result-section">
        <h3>Longest cargo chains ({results.longestChains?.length ?? 0})</h3>
        {results.longestChains?.length ? (
          results.longestChains.map((chain) => (
            <ChainCard key={`chain-${chain.id}`} chain={chain} variant="chain" />
          ))
        ) : (
          <p className="empty-state compact">No continuous cargo chain found.</p>
        )}
      </div>

      <div className="result-section">
        <h3>Detected cycles ({results.cycles?.length ?? 0})</h3>
        {results.cycles?.length ? (
          results.cycles.map((chain) => (
            <ChainCard key={`cycle-${chain.id}`} chain={chain} variant="cycle" />
          ))
        ) : (
          <p className="empty-state compact">No route cycles found.</p>
        )}
      </div>

      <div className="result-section">
        <h3>Single suitable cargo ({results.matches.length})</h3>
        {results.matches.length ? (
          results.matches.map((item) => <ResultCard key={item.cargoId} item={item} variant="match" />)
        ) : (
          <p className="empty-state compact">No suitable cargo found.</p>
        )}
      </div>

      <div className="result-section">
        <h3>{rejectedTitle}</h3>
        {rejectedForSelectedCity.length ? (
          rejectedForSelectedCity.map((item) => (
            <ResultCard key={item.cargoId} item={item} variant="rejected" />
          ))
        ) : (
          <p className="empty-state compact">No rejected cargo from this city.</p>
        )}
      </div>
    </div>
  );
}
