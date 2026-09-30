import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'node:http';
import { Server } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents, Room, GameType } from '@darknote/shared';
import { migrate } from './db';
import { newId, getByCode, getRoom, saveRoom, recordMove, finishRoom } from './store';
import { createTTT, move as tttMove } from './games/ttt';
import { createLudo, roll, movePiece } from './games/ludo';
import roomsRouter from './routes/rooms';
import gamesRouter from './routes/games';

const app = express();
const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
app.use(cors({ origin: clientUrl }));
app.use(express.json({ limit: '32kb' }));
app.get('/health', (_req, res) => res.json({ ok: true, service: 'darknote-games', database: Boolean(process.env.DATABASE_URL) }));
app.use('/api/rooms', roomsRouter);
app.use('/api/games', gamesRouter);

const server = http.createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, { cors: { origin: clientUrl } });
const code = () => Math.random().toString(36).slice(2, 8).toUpperCase();
const find = async (idOrCode: string) => getRoom(idOrCode) ?? getByCode(idOrCode.toUpperCase());
async function broadcast(room: Room) { await saveRoom(room); io.to(room.id).emit('room:state', room); }

io.on('connection', socket => {
  socket.on('room:create', async ({ game, name }, cb) => {
    const max = game === 'ludo' ? 4 : 2;
    const room: Room = { id: newId(), code: code(), game, status: 'waiting', players: [{ id: socket.id, name: String(name).slice(0,24), color: 'purple' }], state: game === 'tic-tac-toe' ? createTTT() : createLudo() };
    await saveRoom(room); socket.join(room.id); cb({ ok: true, room }); await broadcast(room);
    if (max === 0) return;
  });
  socket.on('room:join', async ({ code: joinCode, name }, cb) => {
    const room = await getByCode(joinCode.toUpperCase());
    if (!room) return cb({ ok: false, error: 'Room not found' });
    const max = room.game === 'ludo' ? 4 : 2;
    if (room.players.length >= max) return cb({ ok: false, error: 'Room is full' });
    room.players.push({ id: socket.id, name: String(name).slice(0,24), color: ['purple','blue','green','orange'][room.players.length] });
    room.status = room.players.length === max ? 'playing' : 'waiting';
    socket.join(room.id); cb({ ok: true, room }); await broadcast(room);
  });
  socket.on('ttt:move', async ({ roomId, index }) => {
    const room = await find(roomId); if (!room || room.game !== 'tic-tac-toe') return;
    const current = room.players[room.state.turn]; if (!current || current.id !== socket.id) return socket.emit('game:error', 'Not your turn');
    if (!tttMove(room, index)) return socket.emit('game:error', 'Illegal move');
    await recordMove(room.id, socket.id, 'ttt.move', { index });
    if (room.status === 'finished') await finishRoom(room, room.players[room.state.winner ?? -1]?.id ?? null);
    await broadcast(room);
  });
  socket.on('ludo:roll', async ({ roomId }) => {
    const room = await find(roomId); if (!room || room.game !== 'ludo') return;
    const current = room.players[room.state.turn]; if (!current || current.id !== socket.id) return socket.emit('game:error', 'Not your turn');
    if (!roll(room)) return socket.emit('game:error', 'Cannot roll now');
    await recordMove(room.id, socket.id, 'ludo.roll', { dice: room.state.dice }); await broadcast(room);
  });
  socket.on('ludo:move', async ({ roomId, piece }) => {
    const room = await find(roomId); if (!room || room.game !== 'ludo') return;
    const current = room.players[room.state.turn]; if (!current || current.id !== socket.id) return socket.emit('game:error', 'Not your turn');
    if (!movePiece(room, piece)) return socket.emit('game:error', 'Illegal move');
    await recordMove(room.id, socket.id, 'ludo.move', { piece });
    if (room.status === 'finished') await finishRoom(room, room.players[room.state.winner ?? -1]?.id ?? null);
    await broadcast(room);
  });
  socket.on('disconnect', async () => {
    // Keep room state persistent; clients can reconnect with REST/Socket.IO and rejoin in a future session.
  });
});

migrate().then(() => server.listen(Number(process.env.PORT || 4000), () => console.log(`DARKNOTE server listening on ${process.env.PORT || 4000}`))).catch(err => { console.error(err); process.exit(1); });
