
export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant'
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  feedback?: 'positive' | 'negative';
  image?: string; // base64 data
  sources?: GroundingSource[];
}

export interface ChatSession {
  id: string;
  messages: Message[];
  title: string;
}
