import { randomUUID } from 'node:crypto';
import type { Room, Player } from '@darknote/shared';
import { pool } from './db';

const rooms = new Map<string, Room>();
export const newId = () => randomUUID();

function hydrate(row: any): Room {
  return {
    id: row.id,
    code: row.code,
    game: row.game_type ?? row.game,
    status: row.status,
    players: row.players ?? [],
    state: row.state ?? {}
  } as Room;
}

export async function saveRoom(room: Room) {
  rooms.set(room.id, room);
  if (!pool) return room;
  await pool.query(
    `INSERT INTO game_rooms(id, code, game_type, status, max_players, state)
     VALUES($1,$2,$3,$4,$5,$6)
     ON CONFLICT(id) DO UPDATE SET status=$4,state=$6,updated_at=now()`,
    [room.id, room.code, room.game, room.status, room.game === 'ludo' ? 4 : 2, JSON.stringify(room.state)]
  );
  for (const [seat, player] of room.players.entries()) {
    await pool.query(
      `INSERT INTO room_players(room_id,session_id,display_name,seat,color,connected)
       VALUES($1,$2,$3,$4,$5,true)
       ON CONFLICT(room_id,session_id) DO UPDATE SET display_name=$3,seat=$4,color=$5,connected=true,left_at=null`,
      [room.id, player.id, player.name, seat, player.color]
    );
  }
  return room;
}

export async function getRoom(id: string): Promise<Room | undefined> {
  const cached = rooms.get(id);
  if (cached) return cached;
  if (!pool) return undefined;
  const result = await pool.query(`SELECT r.*, COALESCE(json_agg(json_build_object('id',rp.session_id,'name',rp.display_name,'color',rp.color) ORDER BY rp.seat) FILTER (WHERE rp.id IS NOT NULL),'[]') players
    FROM game_rooms r LEFT JOIN room_players rp ON rp.room_id=r.id AND rp.connected=true WHERE r.id=$1 GROUP BY r.id`, [id]);
  if (!result.rows[0]) return undefined;
  const room = hydrate(result.rows[0]);
  rooms.set(room.id, room);
  return room;
}

export async function getByCode(code: string): Promise<Room | undefined> {
  const cached = [...rooms.values()].find(r => r.code === code);
  if (cached) return cached;
  if (!pool) return undefined;
  const result = await pool.query(`SELECT r.*, COALESCE(json_agg(json_build_object('id',rp.session_id,'name',rp.display_name,'color',rp.color) ORDER BY rp.seat) FILTER (WHERE rp.id IS NOT NULL),'[]') players
    FROM game_rooms r LEFT JOIN room_players rp ON rp.room_id=r.id AND rp.connected=true WHERE r.code=$1 GROUP BY r.id`, [code]);
  if (!result.rows[0]) return undefined;
  const room = hydrate(result.rows[0]);
  rooms.set(room.id, room);
  return room;
}

export async function recordMove(roomId: string, playerSessionId: string | null, moveType: string, payload: unknown) {
  if (!pool) return;
  await pool.query(`INSERT INTO game_moves(room_id,player_id,move_type,payload)
    SELECT $1,rp.id,$3,$4 FROM room_players rp WHERE rp.room_id=$1 AND rp.session_id=$2 LIMIT 1`,
    [roomId, playerSessionId, moveType, JSON.stringify(payload)]);
}

export async function finishRoom(room: Room, winnerSessionId: string | null) {
  if (!pool) return;
  await pool.query(`INSERT INTO game_results(room_id,winner_player_id,result)
    SELECT $1,rp.id,$3 FROM room_players rp WHERE rp.room_id=$1 AND rp.session_id=$2
    ON CONFLICT(room_id) DO UPDATE SET winner_player_id=EXCLUDED.winner_player_id,result=EXCLUDED.result,finished_at=now()`,
    [room.id, winnerSessionId, JSON.stringify(room.state)]);
}
