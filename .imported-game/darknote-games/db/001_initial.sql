CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  country_code CHAR(2),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS game_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(6) NOT NULL UNIQUE,
  game_type TEXT NOT NULL CHECK (game_type IN ('tic-tac-toe','ludo')),
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting','playing','finished','cancelled')),
  host_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  max_players SMALLINT NOT NULL CHECK (max_players BETWEEN 2 AND 4),
  state JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS room_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES game_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  seat SMALLINT NOT NULL,
  color TEXT NOT NULL,
  connected BOOLEAN NOT NULL DEFAULT TRUE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  left_at TIMESTAMPTZ,
  UNIQUE(room_id, seat),
  UNIQUE(room_id, session_id)
);

CREATE INDEX IF NOT EXISTS idx_room_players_room ON room_players(room_id);
CREATE INDEX IF NOT EXISTS idx_game_rooms_status ON game_rooms(status);

CREATE TABLE IF NOT EXISTS game_moves (
  id BIGSERIAL PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES game_rooms(id) ON DELETE CASCADE,
  player_id UUID REFERENCES room_players(id) ON DELETE SET NULL,
  move_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_game_moves_room_created ON game_moves(room_id, created_at);

CREATE TABLE IF NOT EXISTS game_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL UNIQUE REFERENCES game_rooms(id) ON DELETE CASCADE,
  winner_player_id UUID REFERENCES room_players(id) ON DELETE SET NULL,
  result JSONB NOT NULL DEFAULT '{}'::jsonb,
  finished_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
