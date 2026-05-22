import { CircleCheck, CircleOff, Navigation } from "lucide-react";

export default function TruckList({ trucks, selectedTruckId, onSelectTruck, isLoading }) {
  if (isLoading) {
    return <p className="empty-state">Loading trucks...</p>;
  }

  return (
    <div className="truck-list">
      {trucks.map((truck) => {
        const isSelected = truck.id === selectedTruckId;

        return (
          <button
            key={truck.id}
            className={isSelected ? "truck-button selected" : "truck-button"}
            type="button"
            onClick={() => onSelectTruck(truck.id)}
          >
            <span className="truck-button-main">
              {truck.status === "available" ? (
                <CircleCheck size={17} aria-hidden="true" />
              ) : (
                <CircleOff size={17} aria-hidden="true" />
              )}
              <strong>{truck.name}</strong>
            </span>
            <span className="truck-button-sub">
              <Navigation size={14} aria-hidden="true" />
              {truck.isMoving
                ? `to ${truck.arrivalCity?.name ?? "unknown"}`
                : truck.parkingCity?.name ?? "unknown"}
            </span>
          </button>
        );
      })}
    </div>
  );
}

