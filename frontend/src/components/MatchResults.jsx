import { CheckCircle2, XCircle } from "lucide-react";

import { formatShortDateTime } from "../utils/date.js";

function ResultCard({ item, variant }) {
  const Icon = variant === "match" ? CheckCircle2 : XCircle;

  return (
    <article className={`result-card ${variant}`}>
      <div className="result-card-header">
        <div>
          <h3>{item.cargoName}</h3>
          <p>
            {item.pickupCity} to {item.destinationCity}
          </p>
        </div>
        <Icon size={20} aria-hidden="true" />
      </div>
      <div className="result-times">
        <span>Pickup arrival: {formatShortDateTime(item.pickupArrivalTime)}</span>
        <span>Delivery arrival: {formatShortDateTime(item.deliveryArrivalTime)}</span>
      </div>
      <ul>
        {item.reasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
    </article>
  );
}

export default function MatchResults({ results, isLoading }) {
  if (isLoading) {
    return <p className="empty-state">Checking feasible cargo...</p>;
  }

  if (!results) {
    return <p className="empty-state">Select a truck and run matching.</p>;
  }

  return (
    <div className="match-results">
      <div className="match-summary">
        <strong>{results.truck.name}</strong>
        <span>
          calculation time: {formatShortDateTime(results.matchingReferenceTime)}
        </span>
        <span>
          effective city: {results.truck.effectiveCity}, time: {formatShortDateTime(results.truck.effectiveTime)}
        </span>
      </div>

      <div className="result-section">
        <h3>Suitable cargo ({results.matches.length})</h3>
        {results.matches.length ? (
          results.matches.map((item) => <ResultCard key={item.cargoId} item={item} variant="match" />)
        ) : (
          <p className="empty-state compact">No suitable cargo found.</p>
        )}
      </div>

      <div className="result-section">
        <h3>Rejected cargo ({results.rejected.length})</h3>
        {results.rejected.map((item) => (
          <ResultCard key={item.cargoId} item={item} variant="rejected" />
        ))}
      </div>
    </div>
  );
}
