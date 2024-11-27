import { Body, Controller, Get, Post } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('createUser')
  async createUser(@Body('username') username: string) {
    return await this.chatService.createUser(username);
  }

  @Get('getMessages')
  async getMessages() {
    return await this.chatService.getMessages();
  }
}
