# Image Mode - Departures

Vanilla JS + Vite split-flap departure board for the Train Tickets application, packaged as a RHEL bootc image-mode container.

## Features

- **Split-flap animation** — Authentic Solari-style flip animation for every character, ported from the `split-flap` submodule
- **Live timetable** — Fetches all scheduled services from the backend `/api/timetable` endpoint
- **Clock-based windowing** — Displays the next 6 departures relative to the local clock, updating every 30 seconds; then the 6 after that for another 30 seconds
- **Tomorrow indicator** — Departures that have wrapped past midnight are labelled with a small amber **"Tomorrow"** tag above the departure time
- **Automatic looping** — Wraps back to the start of the day's timetable when the last departure has passed
- **No navigation** — Full-screen black display board, no menus or logos

## Display

The board shows 6 rows at a time with four columns:

| Column | Width | Content |
|--------|-------|---------|
| `DEPART` | 5 chars | Departure time (`HH:MM`) |
| `FROM` | 15 chars | Origin station name (truncated) |
| `TO` | 15 chars | Destination station name (truncated) |
| `ARRIVE` | 5 chars | Arrival time (`HH:MM`) |

Each column group is separated by a visible gap. Column headings sit above the board in a large header bar. Flap tiles are 32 × 52 px with a 1.6 rem font — reduced from the tutorial defaults to fit all four columns across a standard 1080p display (~1400 px total width).

## Rotation logic

1. On load the board cold-renders **Window A** (next 6 departures from the local clock) instantly.
2. After 30 seconds it animates to **Window B** (the following 6).
3. After another 30 seconds it animates back to a freshly fetched **Window A**.
4. Any entry sourced by wrapping past the last departure of the day is tagged `tomorrow: true` and displays the amber **Tomorrow** label.
5. If the API is unreachable, `CONNE` is shown in the first DEPART cell as a connection-error indicator.

## Configuration

The board proxies `/api` requests to the backend. The backend hostname is read from the `API_HOST` environment variable (default: `localhost`).

### Container / Image Mode

The hostname is baked into the image at build time via `/etc/train-tickets/departures.env`. To override at runtime, edit that file on the running VM:

```env
API_HOST=backend-hostname
```

### Local Development

```bash
cd departures
npm install
API_HOST=your-backend-host npm run dev
```

The board is served on port **5174**.

## Build

```bash
podman build -t quay.io/kubealex/image-mode-departures:v1.1 .
```

With a custom backend hostname baked into the image:

```bash
podman build --build-arg API_HOST=backend.example.com \
  -t quay.io/kubealex/image-mode-departures:v1.1 .
```

| Build ARG | Default | Description |
|-----------|---------|-------------|
| `API_HOST` | `localhost` | Backend API hostname |

Base image: `quay.io/kubealex/image-mode-baseos:latest`

## Source layout

```
departures/
├── index.html               # Page shell — Google Fonts import, mounts #root
├── vite.config.js           # Dev server on port 5174, /api proxy
├── package.json
├── Containerfile            # bootc RHEL image definition
├── src/
│   ├── main.js              # Entry point — orchestration & 30-second loop
│   ├── board.js             # DOM builder for 6-row flap grid + updateBoard()
│   ├── splitFlap.js         # createFlap() / animateFlap() — core animation
│   ├── timetable.js         # fetchTimetable(), getWindow(), clock windowing
│   ├── style.css            # Board layout, dark theme, Tomorrow label
│   └── flap.css             # Split-flap tile CSS (32×52 px, 1.6 rem font)
└── usr/                     # systemd service + tmpfiles.d overlay
```
