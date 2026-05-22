const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api";

async function request(path, options) {
  const response = await fetch(`${API_BASE_URL}${path}`, options);

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed with status ${response.status}`);
  }

  return response.json();
}

export const api = {
  getHealth: () => request("/health"),
  getCities: () => request("/cities"),
  getCargo: () => request("/cargo"),
  getTrucks: () => request("/trucks"),
  getRoutes: () => request("/routes"),
  getMatches: (truckId) => request(`/trucks/${truckId}/matches`)
};
