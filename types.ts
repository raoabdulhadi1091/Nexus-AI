export type Role = 'user' | 'assistant' | 'system';

export type ReplyMode = 'General' | 'Coder' | 'Writer' | 'Translator' | 'Roman Urdu';

export type ThemePalette = 'cyber-cyan' | 'matrix-emerald' | 'aurora-violet' | 'solar-amber' | 'lunar-light';

export interface AttachedFile {
  name: string;
  size: number;
  type: string;
  mimeType?: string;
  url?: string;
  content?: string; // extracted text or raw base64 data
  base64?: string; // raw base64 for image/audio
  isImage?: boolean;
  isAudio?: boolean;
}

export interface VoiceNoteAttachment {
  name: string;
  size: number;
  mimeType: string;
  base64: string;
  url: string;
  duration: number;
  transcript?: string;
  clientTranscriptHint?: string;
}

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  ts: number;
  file_info?: string;
  image_b64?: string;
  image_mime_type?: string;
  generated_image_b64?: string;
  generated_image_mime?: string;
  generated_prompt?: string;
  audio_b64?: string;
  audio_mime_type?: string;
  is_voice_note?: boolean;
  voice_transcript?: string;
  file?: AttachedFile;
  secondary_file?: AttachedFile;
  feedback?: 'up' | 'down' | null;
  isError?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  updated_at: number;
  is_pinned?: boolean;
}

export interface AppSettings {
  theme: 'dark' | 'light';
  palette: ThemePalette;
  fontSize: number; // 12 - 20 px
  density: 'compact' | 'comfortable' | 'spacious';
  enterToSend: boolean;
  defaultMode: ReplyMode;
  ttsVoice: string;
  ttsRate: number;
  ttsPitch: number;
  soundEffects: boolean;
  streamEffect: boolean;
}
