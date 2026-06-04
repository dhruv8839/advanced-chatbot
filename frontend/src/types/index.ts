export type MessageRole = 'user' | 'bot' | 'system';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  feedback?: 'helpful' | 'unhelpful';
}

export type ChatMode = 'general' | 'study' | 'coding' | 'document' | 'career' | 'business';

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  mode: ChatMode;
  updatedAt: number;
}

export interface UserPreferences {
  language: 'English' | 'Hindi' | 'Hinglish';
  style: 'Short' | 'Detailed' | 'Viva style';
  mainUse: 'Study' | 'Coding' | 'Business' | 'Career';
  theme: 'dark' | 'light';
}
