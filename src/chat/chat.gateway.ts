import {
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:8080',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedClients: string[] = [];

  constructor(private chatService: ChatService) {}

  handleConnection(client: Socket) {
    this.connectedClients.push(client.id);
  }

  handleDisconnect(client: Socket) {
    this.connectedClients = this.connectedClients.filter(
      (id) => id !== client.id,
    );
  }

  @SubscribeMessage('message')
  async handleMessage(
    @MessageBody()
    data: {
      senderId: string;
      content: string;
      room: string;
      receiveId: string;
    },
  ) {
    const message = await this.chatService.saveMessage(
      data.senderId,
      data.content,
      data.room,
    );
    this.server.to(data.room).emit('newMessage', message);
    this.server.emit('messageReceived', {
      sender: data.senderId,
      received: data.receiveId,
    });
  }

  @SubscribeMessage('registerUser')
  handleRegisterUser(
    client: Socket,
    data: { userId: string; username: string },
  ) {
    client.data.userId = data.userId;
    client.data.username = data.username;
    this.updateConnectedUsers();
  }

  updateConnectedUsers() {
    const users = [];
    this.server.sockets.sockets.forEach((socket) => {
      if (socket.data.userId && socket.data.username) {
        users.push({
          userId: socket.data.userId,
          username: socket.data.username,
        });
      }
    });
    this.server.emit('connectedUsers', users);
  }

  @SubscribeMessage('disconnectedUser')
  handleDisconnectedUser(
    client: Socket,
    data: { userId: string; username: string },
  ) {
    client.data.userId = data.userId;
    client.data.username = data.username;
    const users = [];
    this.server.sockets.sockets.forEach((socket) => {
      if (socket.data.userId && socket.data.username) {
        users.push({
          userId: socket.data.userId,
          username: socket.data.username,
        });
      }
    });
    const usersFiltered = users.filter((user) => user.userId !== data.userId);
    this.server.emit('connectedUsers', usersFiltered);
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    client: Socket,
    payload: { userId: string; otherUserId: string },
  ) {
    const roomName = this.getRoomName(payload.userId, payload.otherUserId);
    client.join(roomName);

    const chatHistory = await this.chatService.getMessagesForRoom(roomName);

    client.emit('chatHistory', chatHistory);
  }

  private getRoomName(user1: string, user2: string): string {
    return [user1, user2].sort().join('_');
  }
}
