
export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant'
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  feedback?: 'positive' | 'negative';
}

export interface ChatSession {
  id: string;
  messages: Message[];
  title: string;
}
