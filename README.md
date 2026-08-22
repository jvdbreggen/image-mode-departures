# Image Mode - Departures

Vanilla JS + Vite split-flap departure board for the Train Tickets application, packaged as a RHEL bootc image-mode container.

## Features

- **Split-flap animation** - Authentic Solari-style flip animation for every character
- **Live timetable** - Fetches all scheduled services from the backend `/api/timetable` endpoint
- **Clock-based windowing** - Displays the next 6 departures relative to the local clock, updating every 30 seconds
- **Automatic looping** - Wraps back to the start of the day when the last departure is passed
- **No navigation** - Full-screen black display board, no menus or logos

## Display

The board shows 6 rows at a time with four columns:

| Column | Width | Content |
|--------|-------|---------|
| `DEPARTS` | 5 chars | Departure time (`HH:MM`) |
| `FROM` | 14 chars | Origin station name |
| `TO` | 14 chars | Destination station name |
| `ARRIVES` | 5 chars | Arrival time (`HH:MM`) |

## Configuration

The board proxies `/api` requests to the backend. The backend hostname is read from the `API_HOST` environment variable (default: `localhost`).

### Container / Image Mode

The hostname is baked into the image at build time via a `.env` file. To override at runtime, create `/etc/train-tickets/departures.env`:

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
