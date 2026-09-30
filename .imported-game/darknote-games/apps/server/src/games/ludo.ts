import type { Room } from '@darknote/shared';
export function createLudo(){return {turn:0,dice:null as number|null,pieces:[[-1,-1,-1,-1],[-1,-1,-1,-1]],winner:null as number|null};}
export function roll(room:Room){const s=room.state;if(room.status!=='playing'||s.winner!==null)return false;s.dice=Math.floor(Math.random()*6)+1;return true;}
export function movePiece(room:Room,piece:number){const s=room.state;if(room.status!=='playing'||s.dice===null||s.winner!==null)return false;if(piece<0||piece>3)return false;const p=s.pieces[s.turn];let pos=p[piece];if(pos===-1&&s.dice!==6)return false;pos=pos===-1?0:pos+s.dice;p[piece]=Math.min(pos,56);s.dice=null;if(p.every((x:number)=>x===56)){s.winner=s.turn;room.status='finished';}else s.turn=1-s.turn;return true;}
