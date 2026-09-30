# DARKNOTE Games — Full Stack

React/Next.js frontend + Node.js/Express + Socket.IO backend + Neon PostgreSQL.

## API

- `GET /health`
- `POST /api/rooms` — create a room: `{ "game": "tic-tac-toe" | "ludo", "name": "Player" }`
- `GET /api/rooms/:idOrCode` — get room state
- `POST /api/rooms/:code/join` — join room: `{ "name": "Player" }`
- `POST /api/games/:roomId/tictactoe/move` — `{ "index": 0, "playerId": "session-id" }`
- `POST /api/games/:roomId/ludo/roll` — `{ "playerId": "session-id" }`
- `POST /api/games/:roomId/ludo/move` — `{ "piece": 0, "playerId": "session-id" }`

## Realtime events

Socket.IO events:
- `room:create`
- `room:join`
- `room:state`
- `game:error`
- `ttt:move`
- `ludo:roll`
- `ludo:move`

## Neon database

Run `db/001_initial.sql` against your Neon database, or start the server with `DATABASE_URL` set; the server automatically applies the initial migration.

Schema includes `users`, `game_rooms`, `room_players`, `game_moves`, and `game_results`.

## Run

```bash
npm install
npm run dev
```

Web: http://localhost:3000
API: http://localhost:4000
