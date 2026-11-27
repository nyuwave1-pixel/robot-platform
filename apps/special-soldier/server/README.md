# SPECIAL SOLDIER — dedicated multiplayer server

Runs the match rules (`../src/net/authority.js`) for rooms of up to 15 v 15. Browsers connect with
`wss://HOST/?room=CODE&id=…&name=…`; the game does this for you when a server address is entered in
**OPERATIONS → MULTIPLAYER → DEDICATED SERVER**, or from an invite link `?mp=CODE&server=wss://HOST`.

| Run | Command |
|---|---|
| Local / LAN | `npm run mp:server` (in `apps/special-soldier`) → `ws://<this-pc-ip>:8787` |
| Docker | `docker build -f server/Dockerfile -t special-soldier-mp .` then `docker run -p 8787:8787 special-soldier-mp` |
| Fly.io | see `fly.toml` (Tokyo region, scales to zero when idle) |
| Render / Railway | Docker deploy of `server/Dockerfile`, port 8787, health check `/health` |

The page is served over HTTPS, so a public server must be `wss://` (TLS). `GET /health` returns rooms, players,
score, rejected hit claims, bytes sent and the slowest tick. Measured with `tests/mp-load.mjs`
(30 bots, 60 s): slowest tick 4 ms of 50 ms, ~33 KB/s down per player.

Small rooms (up to 8) do not need this server: they run over Supabase Realtime with the first player as host.
