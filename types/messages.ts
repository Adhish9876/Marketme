export interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  createdAt: Date;
}