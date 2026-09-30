import { Router } from 'express';
import { getByCode, getRoom, recordMove, saveRoom } from '../store';
import { move as tttMove } from '../games/ttt';
import { roll, movePiece } from '../games/ludo';

const router = Router();
const find = async (idOrCode: string) => getRoom(idOrCode) ?? getByCode(idOrCode.toUpperCase());

router.post('/:roomId/tictactoe/move', async (req, res) => {
  const room = await find(req.params.roomId);
  const index = Number(req.body?.index);
  if (!room || room.game !== 'tic-tac-toe') return res.status(404).json({ error: 'Tic-Tac-Toe room not found' });
  if (!Number.isInteger(index)) return res.status(400).json({ error: 'index must be an integer' });
  if (!tttMove(room, index)) return res.status(409).json({ error: 'Illegal move' });
  await recordMove(room.id, req.body?.playerId ?? null, 'ttt.move', { index });
  await saveRoom(room);
  return res.json({ room });
});

router.post('/:roomId/ludo/roll', async (req, res) => {
  const room = await find(req.params.roomId);
  if (!room || room.game !== 'ludo') return res.status(404).json({ error: 'Ludo room not found' });
  if (!roll(room)) return res.status(409).json({ error: 'Cannot roll now' });
  await recordMove(room.id, req.body?.playerId ?? null, 'ludo.roll', { dice: room.state.dice });
  await saveRoom(room);
  res.json({ room });
});

router.post('/:roomId/ludo/move', async (req, res) => {
  const room = await find(req.params.roomId);
  const piece = Number(req.body?.piece);
  if (!room || room.game !== 'ludo') return res.status(404).json({ error: 'Ludo room not found' });
  if (!Number.isInteger(piece)) return res.status(400).json({ error: 'piece must be an integer' });
  if (!movePiece(room, piece)) return res.status(409).json({ error: 'Illegal move' });
  await recordMove(room.id, req.body?.playerId ?? null, 'ludo.move', { piece });
  await saveRoom(room);
  res.json({ room });
});

export default router;
