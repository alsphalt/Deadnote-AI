import { Router } from 'express';
import { newId, getByCode, getRoom, saveRoom } from '../store';
import { createTTT } from '../games/ttt';
import { createLudo } from '../games/ludo';
import type { GameType, Room } from '@darknote/shared';

const router = Router();
const roomCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();
const cleanName = (value: unknown) => String(value ?? '').trim().slice(0, 24);

router.post('/', async (req, res) => {
  const game = req.body?.game as GameType;
  const name = cleanName(req.body?.name);
  if (!['tic-tac-toe', 'ludo'].includes(game) || !name) return res.status(400).json({ error: 'game and name are required' });
  const room: Room = {
    id: newId(), code: roomCode(), game, status: 'waiting',
    players: [{ id: newId(), name, color: 'purple' }],
    state: game === 'tic-tac-toe' ? createTTT() : createLudo()
  };
  await saveRoom(room);
  res.status(201).json({ room });
});

router.get('/:id', async (req, res) => {
  const room = await getRoom(req.params.id) ?? await getByCode(req.params.id.toUpperCase());
  if (!room) return res.status(404).json({ error: 'Room not found' });
  res.json({ room });
});

router.post('/:code/join', async (req, res) => {
  const code = req.params.code.toUpperCase();
  const room = await getByCode(code);
  const name = cleanName(req.body?.name);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  if (!name) return res.status(400).json({ error: 'name is required' });
  const max = room.game === 'ludo' ? 4 : 2;
  if (room.players.length >= max) return res.status(409).json({ error: 'Room is full' });
  room.players.push({ id: newId(), name, color: ['purple', 'blue', 'green', 'orange'][room.players.length] });
  room.status = room.players.length === max ? 'playing' : 'waiting';
  await saveRoom(room);
  res.json({ room });
});

export default router;
