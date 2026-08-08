# mock-api

A zero-dependency stand-in for the FastAPI backend, so lanes A and B can build
the whole offline-queue path before lane C's real API exists.

**Lane C:** delete this the moment `c-phase1-schema` lands. It is scaffolding,
not a second implementation to keep in sync.

## Run

```bash
node --experimental-strip-types mock-api/server.mjs # defaults to port 8000
PORT=8099 node --experimental-strip-types mock-api/server.mjs # or pick a port
```

From the repository root, the equivalent command is `npm run api`.

No `npm install`. Node 22 has everything it needs. It reads `seed/*.json` at
boot and holds all POSTed state in memory — restart to reset.

## Reaching it from a phone on the same wifi

The server binds `0.0.0.0`, so a phone on the same network can reach it — you
just need this machine's LAN IP.

```powershell
# Windows
ipconfig            # look for "IPv4 Address" under your active adapter
```

Then set the app's API base URL to `http://<that-ip>:8000` (put it in
`.env.example` as `EXPO_PUBLIC_API_URL`). `localhost` will **not** work from the
phone — that resolves to the phone itself.

Set `EXPO_PUBLIC_API_URL=http://<that-ip>:8000` in `.env.local`, then restart
Expo after changing it. `localhost` works only for the same computer. For an
Android emulator use `http://10.0.2.2:8000`; for an iOS simulator use
`http://127.0.0.1:8000`; for a physical phone use the computer's LAN IPv4
address and allow Node through the Windows firewall on private networks.

Mobile request path: `AnswerScreen` → `services/dhamma.ask()` → `POST
/dhamma/ask` → `core/dhamma/engine.ts` → Ollama Cloud.

Keep `OLLAMA_API_KEY` only in the backend environment. Never put it in
`.env.local` or an `EXPO_PUBLIC_` variable.

## Debug hooks

Every endpoint honours two query params so lane A can drive its loading and
error states on purpose:

| Param | Effect |
|---|---|
| `?delay=1500` | respond after 1500 ms (capped at 10 s) |
| `?fail=503` | respond with that HTTP status and an `ApiError` body |

```bash
curl "localhost:8000/sites?delay=2000"   # test the spinner
curl "localhost:8000/sites?fail=503"     # test the error card
```

## Endpoints (04-ARCHITECTURE §3)

| Method | Path | Returns |
|---|---|---|
| GET | `/health` | `{ok, service, sites}` — also the deploy hello-world |
| GET | `/sites` | `Site[]` |
| GET | `/sites/{id}` | `{site, vantages, plates, timeline}` |
| GET | `/vantages/next?lat&lon` | nearest active, unsurveyed vantage (+`distance_m`) |
| GET | `/vantages/{id}/series` | `Capture[]` ordered by time |
| POST | `/captures` | `{id, align_score, series_url}` |
| POST | `/reports` | `{id, status, cluster_id}` — awards `first_report` merit |
| GET | `/reports?site_id&status` | `Report[]` |
| POST | `/reports/{id}/corroborate` | `{corroborations, status}` |
| GET | `/merit/me` | `{balance, today, cap, remaining, complete, events}` |
| GET | `/needs` | `Need[]` |
| POST | `/allocations` | the created `Allocation` |
| GET | `/quests?lat&lon` | `[{quest, availability, distance_m, completed_at}]` |
| POST | `/quests/{id}/complete` | `{merit_awarded, evidence_id, merit_capped}` — riddles return `{correct:false, hint}` on a miss |
| POST | `/dhamma/ask` | a `passages_only` response — the mock never generates |
| GET | `/dashboard` | coverage %, status counts, median align score |
| GET | `/export?format=csv\|geojson\|crm` | conservation extract (CRM = CIDOC-CRM shape) |

## What the mock does and does not model

- **Daily merit cap (200)** is enforced, so lane A can test the "You've done
  enough today" state by POSTing enough completions.
- **Riddle answers** are checked with the same tolerant normalisation the app
  uses; a wrong answer returns a hint, never a failure.
- It does **not** do real auth, image upload bytes, or retrieval — a single
  `demo-user` owns everything, captures store a `mock://` URL, and `/dhamma/ask`
  returns a fixed cited passage.
