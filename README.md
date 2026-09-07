# BHURAKSHA

AI-Powered Landslide Early Warning & Risk Management System for North Eastern India.

Prototype for SIH26001 (MDoNER) — **Prototype • Simulated Data**.

## Run

```bash
npm install
npm run dev
```

Open the URL Vite prints (default http://localhost:5173).

## Demo desks

| Username | Password   | Desk                         |
|----------|------------|------------------------------|
| ndma     | raksha2026 | NDMA / MDoNER joint cell     |
| district | raksha2026 | District disaster authority  |
| field    | raksha2026 | BRO / PWD slope cell         |
| citizen  | raksha2026 | Village disaster committee   |

## What judges should click

1. Sign in as `ndma`.
2. Watch the command-center KPIs and Leaflet heatmap tick every 2.5s.
3. GIS operations — filter by state, click a zone.
4. AI engine — SHAP-style contributions and 6-hour nowcast.
5. Early warning — language switch (EN/HI/AS), broadcast, acknowledge.
6. Sensors, IMD weather, field report (offline queue), response board.
7. SITREP factory — Generate PDF / TXT.

Do not treat sensor values or forecasts as operational NDMA products.
