'use client'

import { useMemo, useState } from 'react'
import { RotateCcw, Sparkles, Trophy, Users, Dice5, ArrowLeft } from 'lucide-react'

type Game = 'home' | 'ttt' | 'ludo'
type Mark = 'X' | 'O' | null

type LudoState = {
  turn: 0 | 1
  dice: number | null
  pieces: [number[], number[]]
  winner: number | null
}

const lines = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]]
const colors = ['violet', 'cyan'] as const

function freshLudo(): LudoState {
  return { turn: 0, dice: null, pieces: [[-1, -1, -1, -1], [-1, -1, -1, -1]], winner: null }
}

export default function Page() {
  const [game, setGame] = useState<Game>('home')
  const [name, setName] = useState('Player one')
  const [tttBoard, setTttBoard] = useState<Mark[]>(Array(9).fill(null))
  const [tttTurn, setTttTurn] = useState<Mark>('X')
  const [tttWinner, setTttWinner] = useState<Mark | 'draw' | null>(null)
  const [ludo, setLudo] = useState(freshLudo)
  const [message, setMessage] = useState('')

  const tttStatus = useMemo(() => {
    if (tttWinner === 'draw') return 'Board locked — it is a draw.'
    if (tttWinner) return `${tttWinner === 'X' ? name : 'Nova'} wins the round.`
    return `${tttTurn === 'X' ? name : 'Nova'}'s turn`
  }, [name, tttTurn, tttWinner])

  function chooseGame(next: Exclude<Game, 'home'>) {
    setGame(next)
    setMessage('')
  }

  function playTtt(index: number) {
    if (tttBoard[index] || tttWinner) return
    const next = [...tttBoard]
    next[index] = tttTurn
    const hit = lines.find(([a, b, c]) => next[a] && next[a] === next[b] && next[a] === next[c])
    setTttBoard(next)
    if (hit) setTttWinner(tttTurn)
    else if (next.every(Boolean)) setTttWinner('draw')
    else setTttTurn(tttTurn === 'X' ? 'O' : 'X')
  }

  function resetTtt() {
    setTttBoard(Array(9).fill(null))
    setTttTurn('X')
    setTttWinner(null)
  }

  function rollDice() {
    if (ludo.winner !== null || ludo.dice !== null) return
    setLudo((current) => ({ ...current, dice: Math.floor(Math.random() * 6) + 1 }))
    setMessage('Choose one of your pieces to move.')
  }

  function movePiece(piece: number) {
    if (ludo.winner !== null || ludo.dice === null) return
    const dice = ludo.dice
    const currentPosition = ludo.pieces[ludo.turn][piece]
    if (currentPosition === -1 && dice !== 6) {
      setMessage('A piece needs a six to leave the yard.')
      return
    }
    const nextPieces: [number[], number[]] = [ludo.pieces[0].slice(), ludo.pieces[1].slice()]
    nextPieces[ludo.turn][piece] = currentPosition === -1 ? 0 : Math.min(56, currentPosition + dice)
    const won = nextPieces[ludo.turn].every((position) => position === 56)
    setLudo({ pieces: nextPieces, dice: null, turn: ludo.turn === 0 ? 1 : 0, winner: won ? ludo.turn : null })
    setMessage(won ? `${ludo.turn === 0 ? name : 'Nova'} completed every piece.` : '')
  }

  function resetLudo() {
    setLudo(freshLudo())
    setMessage('')
  }

  if (game === 'home') {
    return <main className="shell"><header className="topbar"><div className="brand"><span className="brand-mark"><Sparkles /></span><span>DARKNOTE<span className="brand-muted"> / GAMES</span></span></div><span className="live-pill"><span /> local arcade</span></header><section className="hero"><div><p className="eyebrow">GAME NIGHT, REIMAGINED</p><h1>Small games.<br /><em>Big energy.</em></h1><p className="hero-copy">A focused local arcade for quick rounds, sharp moves, and friendly rivalries.</p></div><div className="hero-orbit" aria-hidden="true"><span className="orbit orbit-one" /><span className="orbit orbit-two" /><span className="orbit-dot" /></div></section><section className="name-panel"><label htmlFor="player-name">Your player name</label><input id="player-name" value={name} maxLength={24} onChange={(event) => setName(event.target.value || 'Player one')} /><span>Playing on this device</span></section><section className="game-grid"><GameCard title="Tic-Tac-Toe" kicker="01 / STRATEGY" description="The classic three-in-a-row duel. Outsmart Nova, or hand the crown to a friend." accent="violet" icon="×" onClick={() => chooseGame('ttt')} /><GameCard title="Ludo Sprint" kicker="02 / LUCK + TACTIC" description="Race four pieces around the track. Roll smart, block the path, take the win." accent="cyan" icon="●" onClick={() => chooseGame('ludo')} /></section><footer className="footer-note"><span><Users /> 2 players locally</span><span>Ready when you are</span></footer></main>
  }

  return <main className="shell game-shell"><header className="topbar"><button className="back-button" onClick={() => setGame('home')}><ArrowLeft /> Arcade</button><div className="brand"><span className="brand-mark"><Sparkles /></span><span>DARKNOTE<span className="brand-muted"> / {game === 'ttt' ? 'TIC-TAC-TOE' : 'LUDO SPRINT'}</span></span></div><span className="live-pill"><span /> playing locally</span></header>{game === 'ttt' ? <section className="play-layout"><div className="play-intro"><p className="eyebrow">01 / STRATEGY</p><h1>Make your mark.</h1><p>Three in a row takes the round. You are <strong className="violet-text">X</strong>, Nova is <strong>O</strong>.</p><div className="status-card"><span className="status-label">CURRENT TURN</span><strong>{tttStatus}</strong><span className="status-line" /></div><button className="outline-button" onClick={resetTtt}><RotateCcw /> Reset board</button></div><div className="ttt-wrap"><div className="ttt-board" role="grid" aria-label="Tic-Tac-Toe board">{tttBoard.map((mark, index) => <button key={index} className={`ttt-cell ${mark ? `mark-${mark.toLowerCase()}` : ''}`} onClick={() => playTtt(index)} aria-label={mark ? `Cell ${index + 1}: ${mark}` : `Cell ${index + 1}: empty`}>{mark}</button>)}</div><p className="board-hint">{tttWinner ? 'Round complete — reset to play again.' : 'Tap an empty cell to place your mark.'}</p></div></section> : <LudoBoard state={ludo} name={name} message={message} onRoll={rollDice} onMove={movePiece} onReset={resetLudo} />}</main>
}

function GameCard({ title, kicker, description, accent, icon, onClick }: { title: string; kicker: string; description: string; accent: 'violet' | 'cyan'; icon: string; onClick: () => void }) {
  return <button className={`game-card card-${accent}`} onClick={onClick}><span className="card-icon">{icon}</span><span className="card-kicker">{kicker}</span><strong>{title}</strong><span className="card-description">{description}</span><span className="play-link">Play now <span>↗</span></span></button>
}

function LudoBoard({ state, name, message, onRoll, onMove, onReset }: { state: LudoState; name: string; message: string; onRoll: () => void; onMove: (piece: number) => void; onReset: () => void }) {
  return <section className="ludo-layout"><div className="play-intro"><p className="eyebrow">02 / LUCK + TACTIC</p><h1>Race the clock.</h1><p>Get a six to launch a piece, then bring all four home before Nova does.</p><div className="status-card"><span className="status-label">CURRENT TURN</span><strong>{state.winner !== null ? `${state.winner === 0 ? name : 'Nova'} wins!` : state.turn === 0 ? `${name}'s turn` : "Nova's turn"}</strong><span className="status-line" /></div><button className="outline-button" onClick={onReset}><RotateCcw /> New race</button></div><div className="ludo-stage"><div className="ludo-track" aria-label="Ludo race track">{Array.from({ length: 56 }, (_, index) => <div key={index} className={`track-cell track-${index % 4}`}><span>{state.pieces[0].map((position, piece) => position === index && <i key={piece} className="piece piece-violet" />)}{state.pieces[1].map((position, piece) => position === index && <i key={piece} className="piece piece-cyan" />)}</span></div>)}</div><div className="ludo-controls"><div className="dice-display" aria-live="polite">{state.dice ?? '—'}</div><button className="primary-button" onClick={onRoll} disabled={state.dice !== null || state.winner !== null}><Dice5 /> Roll dice</button><div className="piece-buttons">{[0, 1, 2, 3].map((piece) => <button key={piece} className={`piece-button ${colors[state.turn]}`} onClick={() => onMove(piece)} disabled={state.dice === null || state.winner !== null}>Piece {piece + 1}<span>{state.pieces[state.turn][piece] === -1 ? 'yard' : `${state.pieces[state.turn][piece]}/56`}</span></button>)}</div></div>{message && <p className="game-message">{message}</p>}</div></section>
}
