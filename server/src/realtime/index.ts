import { WebSocketServer, WebSocket } from 'ws';
import { Server as HttpServer } from 'http';

interface ClientConnection {
  ws: WebSocket;
  userId?: string;
  workspaceId?: string;
  roomId?: string;
}

export class RealtimeServer {
  private wss: WebSocketServer;
  private clients: Map<WebSocket, ClientConnection> = new Map();

  constructor(server: HttpServer) {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws: WebSocket) => {
      const conn: ClientConnection = { ws };
      this.clients.set(ws, conn);

      ws.on('message', (data: string) => {
        try {
          const msg = JSON.parse(data.toString());
          this.handleMessage(conn, msg);
        } catch (err) {
          console.error('Realtime message parse error:', err);
        }
      });

      ws.on('close', () => {
        if (conn.roomId) {
          this.broadcastToRoom(conn.roomId, {
            type: 'peer_left',
            peerId: conn.userId
          }, ws);
        }
        this.clients.delete(ws);
      });

      ws.send(JSON.stringify({ type: 'connected', message: 'Connected to Continuum Realtime Bus' }));
    });
  }

  private handleMessage(conn: ClientConnection, msg: any) {
    switch (msg.type) {
      case 'identify':
        conn.userId = msg.userId;
        conn.workspaceId = msg.workspaceId;
        break;

      case 'join_room':
        conn.roomId = msg.roomId;
        this.broadcastToRoom(msg.roomId, {
          type: 'peer_joined',
          peerId: conn.userId
        }, conn.ws);
        break;

      case 'leave_room':
        if (conn.roomId) {
          this.broadcastToRoom(conn.roomId, {
            type: 'peer_left',
            peerId: conn.userId
          }, conn.ws);
          conn.roomId = undefined;
        }
        break;

      // WebRTC Signaling Relay
      case 'webrtc_offer':
      case 'webrtc_answer':
      case 'webrtc_ice_candidate':
        if (conn.roomId) {
          this.broadcastToRoom(conn.roomId, {
            ...msg,
            senderId: conn.userId
          }, conn.ws);
        }
        break;

      case 'broadcast_task_update':
        this.broadcastToWorkspace(conn.workspaceId, {
          type: 'task_updated',
          taskId: msg.taskId,
          resumePoint: msg.resumePoint
        });
        break;

      case 'chat_message':
        this.broadcastToWorkspace(conn.workspaceId, {
          type: 'new_chat_message',
          channelId: msg.channelId,
          message: msg.message
        });
        break;
    }
  }

  public broadcastToRoom(roomId: string, payload: any, exceptWs?: WebSocket) {
    const data = JSON.stringify(payload);
    for (const [ws, conn] of this.clients.entries()) {
      if (conn.roomId === roomId && ws !== exceptWs && ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    }
  }

  public broadcastToWorkspace(workspaceId: string | undefined, payload: any) {
    if (!workspaceId) return;
    const data = JSON.stringify(payload);
    for (const [ws, conn] of this.clients.entries()) {
      if (conn.workspaceId === workspaceId && ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    }
  }
}
