import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const authHeader = client.handshake.auth?.token || client.handshake.headers?.authorization;
      const token = authHeader ? authHeader.replace(/^Bearer\s+/i, '') : null;

      if (!token) {
        this.logger.debug(`Socket client ${client.id} connected anonymously`);
        return;
      }

      const secret =
        this.configService.get<string>('JWT_ACCESS_SECRET') ||
        'dev-jwt-access-secret-qstack-2026-key';

      const payload = this.jwtService.verify(token, { secret });
      const userId = payload.sub || payload.userId;

      if (userId) {
        client.data.userId = userId;
        client.join(`user:${userId}`);
        this.logger.log(`Socket user ${userId} connected and joined room user:${userId}`);
      }
    } catch (err: any) {
      this.logger.warn(`Socket authentication failed for client ${client.id}: ${err.message}`);
    }
  }

  handleDisconnect(client: Socket) {
    if (client.data.userId) {
      this.logger.debug(`Socket user ${client.data.userId} disconnected (${client.id})`);
    }
  }

  sendNotificationToUser(userId: string, notification: any) {
    if (this.server) {
      this.server.to(`user:${userId}`).emit('notification:new', notification);
    }
  }
}
