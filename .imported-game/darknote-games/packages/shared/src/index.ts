export type GameType = 'tic-tac-toe' | 'ludo';
export type RoomStatus = 'waiting' | 'playing' | 'finished';
export interface Player { id:string; name:string; color:string; }
export interface Room { id:string; code:string; game:GameType; status:RoomStatus; players:Player[]; state:any; }
export interface ServerToClientEvents { 'room:state':(room:Room)=>void; 'game:error':(message:string)=>void; }
export interface ClientToServerEvents { 'room:create':(payload:{game:GameType;name:string}, cb:(r:any)=>void)=>void; 'room:join':(payload:{code:string;name:string}, cb:(r:any)=>void)=>void; 'ttt:move':(payload:{roomId:string;index:number})=>void; 'ludo:roll':(payload:{roomId:string})=>void; 'ludo:move':(payload:{roomId:string;piece:number})=>void; }
