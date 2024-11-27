import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';
import { Message } from './schemas/message.schema';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Message.name) private messageModel: Model<Message>,
  ) {}

  async createUser(username: string): Promise<User> {
    const user = new this.userModel({ username });
    return user.save();
  }

  async saveMessage(
    senderId: string,
    content: string,
    room: string,
  ): Promise<Message> {
    const message = new this.messageModel({ senderId, content, room });
    return message.save();
  }

  async getMessages(): Promise<Message[]> {
    return this.messageModel
      .find()
      .sort({ timestamp: 1 })
      .populate('senderId')
      .exec();
  }

  async getMessagesForRoom(roomName: string) {
    return await this.messageModel.find({ room: roomName }).exec();
  }
}
