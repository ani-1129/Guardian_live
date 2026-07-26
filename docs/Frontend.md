# Frontend Architecture Document

The frontend is built on **Next.js (App Router)** and styled using **Tailwind CSS** with **shadcn/ui** components.

## Directory Structure
- `frontend/app/`: File-system routing layouts and page endpoints.
- `frontend/components/`: Modular component registry.
  - `Map/`: Leaflet map view with real-time vector overlays.
  - `Dispatch/`: Console for incident status management.
  - `Alerts/`: Flash feeds for incoming SOS alerts.
- `frontend/hooks/`: React Query queries, mutations, and WebSocket event subscribers.
- `frontend/services/`: Fetch wrappers for communicating with REST APIs.
- `frontend/store/`: Zustand state store for UI preferences and active incident selections.
