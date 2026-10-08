import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Paperclip,
  Square,
  Mic,
  MicOff,
  X,
  FileText,
  Sparkles,
  Code,
  FileSpreadsheet,
  Globe,
  PenTool,
  Brain,
  Image as ImageIcon,
  Volume2,
  AlertCircle,
} from 'lucide-react';
import { AttachedFile, ReplyMode, AppSettings, VoiceNoteAttachment } from '../types';
import {
  processUploadedFile,
  validateUploadedFile,
  formatFileSize,
  SUPPORTED_EXTENSIONS,
} from '../utils/fileExtractor';
import { getPalette } from '../utils/themePalettes';
import { sound } from '../utils/soundEffects';

export interface SendMessageExtras {
  voiceNote?: VoiceNoteAttachment;
  secondaryFile?: AttachedFile;
  forceImageGen?: boolean;
}

interface ChatInputProps {
  onSendMessage: (text: string, file?: AttachedFile, extras?: SendMessageExtras) => void;
  onStopGeneration: () => void;
  isGenerating: boolean;
  enterToSend: boolean;
  currentMode: ReplyMode;
  settings: AppSettings;
  onQuickAction: (actionText: string) => void;
  inputRef?: React.RefObject<HTMLTextAreaElement | null>;
  externalAttachment?: AttachedFile | null;
  onClearExternalAttachment?: () => void;
}

const QUICK_ACTIONS = [
  { label: 'Code', icon: Code, prefix: 'Write clean, robust code for: ', isImageGen: false },
  { label: 'Debug', icon: Sparkles, prefix: 'Identify bugs and optimize: ', isImageGen: false },
  { label: 'Explain', icon: Brain, prefix: 'Explain in simple terms step-by-step: ', isImageGen: false },
  { label: 'Summarize', icon: FileText, prefix: 'Summarize the core takeaways: ', isImageGen: false },
  {
    label: 'Analyze Data',
    icon: FileSpreadsheet,
    prefix: 'Analyze this dataset and provide statistical insights: ',
    isImageGen: false,
  },
  { label: 'Write', icon: PenTool, prefix: 'Draft a professional communication about: ', isImageGen: false },
  { label: 'Translate', icon: Globe, prefix: 'Translate this accurately into English: ', isImageGen: false },
  { label: 'Generate Image', icon: ImageIcon, prefix: 'Generate an image of: ', isImageGen: true },
];

function getSupportedRecorderMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return '';
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/ogg',
    'audio/mp4',
    'audio/wav',
  ];
  for (const mime of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(mime)) {
        return mime;
      }
    } catch {
      // ignore
    }
  }
  return '';
}

function encodeFloat32ToWavBlob(samples: Float32Array, inputSampleRate: number, targetSampleRate = 16000): Blob {
  // Downsample to 16kHz mono for compact, universal speech-to-text compatibility across mobile & all browsers
  let pcmFloat = samples;
  let finalRate = inputSampleRate;

  if (inputSampleRate > targetSampleRate && inputSampleRate > 0) {
    const ratio = inputSampleRate / targetSampleRate;
    const newLength = Math.max(1, Math.round(samples.length / ratio));
    pcmFloat = new Float32Array(newLength);
    for (let i = 0; i < newLength; i++) {
      const start = Math.floor(i * ratio);
      const end = Math.min(samples.length, Math.floor((i + 1) * ratio));
      let sum = 0;
      let count = 0;
      for (let j = start; j < end; j++) {
        sum += samples[j];
        count++;
      }
      pcmFloat[i] = count > 0 ? sum / count : samples[Math.min(start, samples.length - 1)] || 0;
    }
    finalRate = targetSampleRate;
  }

  // Peak normalize quiet mobile/laptop microphones so speech is always clear
  let maxPeak = 0;
  for (let i = 0; i < pcmFloat.length; i++) {
    const abs = Math.abs(pcmFloat[i]);
    if (abs > maxPeak) maxPeak = abs;
  }
  const gain = maxPeak > 0.005 && maxPeak < 0.5 ? Math.min(0.85 / maxPeak, 6.0) : 1.0;

  const buffer = new ArrayBuffer(44 + pcmFloat.length * 2);
  const view = new DataView(buffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + pcmFloat.length * 2, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM format = 1
  view.setUint16(22, 1, true); // Mono = 1 channel
  view.setUint32(24, finalRate, true);
  view.setUint32(28, finalRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true); // 16-bit
  writeStr(36, 'data');
  view.setUint32(40, pcmFloat.length * 2, true);

  let offset = 44;
  for (let i = 0; i < pcmFloat.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, pcmFloat[i] * gain));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const res = String(reader.result || '');
      const commaIdx = res.indexOf(',');
      resolve(commaIdx !== -1 ? res.slice(commaIdx + 1) : res);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onStopGeneration,
  isGenerating,
  enterToSend,
  settings,
  inputRef: externalInputRef,
  externalAttachment,
  onClearExternalAttachment,
}) => {
  const [text, setText] = useState('');
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const [secondaryFile, setSecondaryFile] = useState<AttachedFile | null>(null);
  const [voiceNote, setVoiceNote] = useState<VoiceNoteAttachment | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isImageGenMode, setIsImageGenMode] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [statusAlert, setStatusAlert] = useState<string | null>(null);

  const localTextareaRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = externalInputRef || localTextareaRef;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const pcmChunksRef = useRef<Float32Array[]>([]);
  const pcmSampleRateRef = useRef<number>(44100);
  const audioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const recordingStartRef = useRef<number>(0);
  const speechRecRef = useRef<any>(null);
  const clientTranscriptRef = useRef<string>('');

  const palette = getPalette(settings.palette);

  // Sync external reference attachment (e.g., from "Use as reference" or "Ask about image")
  useEffect(() => {
    if (externalAttachment) {
      setAttachedFile(externalAttachment);
      onClearExternalAttachment?.();
      textareaRef.current?.focus();
    }
  }, [externalAttachment, onClearExternalAttachment]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 180);
      textareaRef.current.style.height = `${Math.max(newHeight, 48)}px`;
    }
  }, [text]);

  // Cleanup active recording stream on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        window.clearInterval(timerIntervalRef.current);
      }
      if (speechRecRef.current) {
        try {
          speechRecRef.current.stop();
        } catch {}
      }
      if (scriptProcessorRef.current) {
        try {
          scriptProcessorRef.current.disconnect();
        } catch {}
      }
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
        } catch {}
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const showTemporaryAlert = (msg: string) => {
    setStatusAlert(msg);
    window.setTimeout(() => {
      setStatusAlert((prev) => (prev === msg ? null : prev));
    }, 5000);
  };

  const finalizeRecordingAudio = async (rawBlob?: Blob, rawMime?: string) => {
    const duration = Math.max(1, Math.round((Date.now() - recordingStartRef.current) / 1000));

    // Cleanup WebAudio nodes
    if (scriptProcessorRef.current) {
      try {
        scriptProcessorRef.current.disconnect();
      } catch {}
      scriptProcessorRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        await audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    // Priority 1: Build universal 16kHz 16-bit mono WAV from live WebAudio PCM samples
    if (pcmChunksRef.current.length > 0) {
      const totalLen = pcmChunksRef.current.reduce((acc, arr) => acc + arr.length, 0);
      if (totalLen > 800) {
        const merged = new Float32Array(totalLen);
        let offset = 0;
        for (const chunk of pcmChunksRef.current) {
          merged.set(chunk, offset);
          offset += chunk.length;
        }
        const wavBlob = encodeFloat32ToWavBlob(merged, pcmSampleRateRef.current, 16000);
        const base64 = await blobToBase64(wavBlob);
        const url = URL.createObjectURL(wavBlob);
        setVoiceNote({
          name: `voice-note-${Date.now()}.wav`,
          size: wavBlob.size,
          mimeType: 'audio/wav',
          base64,
          url,
          duration,
          clientTranscriptHint: clientTranscriptRef.current || undefined,
        });
        return;
      }
    }

    // Priority 2: Decode MediaRecorder blob to universal 16kHz WAV or use raw blob directly
    if (rawBlob && rawBlob.size > 0) {
      try {
        const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const decodeCtx = new AudioCtx();
          const arrayBuf = await rawBlob.arrayBuffer();
          const audioBuf = await decodeCtx.decodeAudioData(arrayBuf);
          const channelData = audioBuf.getChannelData(0);
          const wavBlob = encodeFloat32ToWavBlob(channelData, audioBuf.sampleRate, 16000);
          await decodeCtx.close().catch(() => {});
          const base64 = await blobToBase64(wavBlob);
          const url = URL.createObjectURL(wavBlob);
          setVoiceNote({
            name: `voice-note-${Date.now()}.wav`,
            size: wavBlob.size,
            mimeType: 'audio/wav',
            base64,
            url,
            duration,
            clientTranscriptHint: clientTranscriptRef.current || undefined,
          });
          return;
        }
      } catch {
        // Fall through to raw blob
      }

      const finalMime = (rawMime || 'audio/webm').split(';')[0].trim();
      const ext = finalMime.includes('ogg')
        ? 'ogg'
        : finalMime.includes('mp4') || finalMime.includes('m4a') || finalMime.includes('aac')
          ? 'm4a'
          : finalMime.includes('wav')
            ? 'wav'
            : 'webm';
      const base64 = await blobToBase64(rawBlob);
      const url = URL.createObjectURL(rawBlob);
      setVoiceNote({
        name: `voice-note-${Date.now()}.${ext}`,
        size: rawBlob.size,
        mimeType: finalMime,
        base64,
        url,
        duration,
        clientTranscriptHint: clientTranscriptRef.current || undefined,
      });
    }
  };

  const startRecording = async () => {
    setStatusAlert(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showTemporaryAlert('Microphone permission is required for voice input.');
      return;
    }

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      mediaStreamRef.current = stream;
      audioChunksRef.current = [];
      pcmChunksRef.current = [];
      clientTranscriptRef.current = '';

      // Attach live WebAudio PCM capture so mobile Safari, Android Chrome, Firefox, and all tabs record standard 16kHz WAV reliably
      try {
        const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const audioCtx: AudioContext = new AudioCtx();
          if (audioCtx.state === 'suspended') {
            await audioCtx.resume().catch(() => {});
          }
          pcmSampleRateRef.current = audioCtx.sampleRate || 44100;
          const source = audioCtx.createMediaStreamSource(stream);
          const processor = audioCtx.createScriptProcessor(4096, 1, 1);
          processor.onaudioprocess = (e: AudioProcessingEvent) => {
            const input = e.inputBuffer.getChannelData(0);
            if (input && input.length > 0) {
              pcmChunksRef.current.push(new Float32Array(input));
            }
          };
          source.connect(processor);
          processor.connect(audioCtx.destination);
          audioContextRef.current = audioCtx;
          scriptProcessorRef.current = processor;
        }
      } catch {
        // Fallback to MediaRecorder if AudioContext is unavailable
      }

      // IMPORTANT: On Mobile (Android / iOS), running SpeechRecognition concurrently with getUserMedia steals hardware mic focus!
      // Only run optional SpeechRecognition hint on non-mobile desktop browsers.
      const isMobileDevice =
        /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '') ||
        (typeof navigator.maxTouchPoints === 'number' && navigator.maxTouchPoints > 1);

      if (!isMobileDevice) {
        try {
          const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
          if (SpeechRec) {
            const recognition = new SpeechRec();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.onresult = (event: any) => {
              let gathered = '';
              for (let i = 0; i < event.results.length; i++) {
                gathered += event.results[i][0].transcript + ' ';
              }
              if (gathered.trim()) {
                clientTranscriptRef.current = gathered.trim();
              }
            };
            recognition.onerror = () => {};
            recognition.start();
            speechRecRef.current = recognition;
          }
        } catch {}
      }

      if (typeof MediaRecorder !== 'undefined') {
        const mimeType = getSupportedRecorderMimeType();
        const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);

        recorder.ondataavailable = (event: BlobEvent) => {
          if (event.data && event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        recorder.onstop = async () => {
          if (speechRecRef.current) {
            try {
              speechRecRef.current.stop();
            } catch {}
            speechRecRef.current = null;
          }

          const finalMime = (recorder.mimeType || mimeType || 'audio/webm').split(';')[0].trim();
          const audioBlob = new Blob(audioChunksRef.current, { type: finalMime });
          await finalizeRecordingAudio(audioBlob, finalMime);
        };

        mediaRecorderRef.current = recorder;
        recorder.start(200);
      } else {
        mediaRecorderRef.current = null;
      }

      recordingStartRef.current = Date.now();
      setRecordingSeconds(0);
      setIsRecording(true);
      if (settings.soundEffects) sound.click();

      timerIntervalRef.current = window.setInterval(() => {
        setRecordingSeconds(Math.floor((Date.now() - recordingStartRef.current) / 1000));
      }, 500);
    } catch {
      setIsRecording(false);
      showTemporaryAlert('Microphone permission is required for voice input.');
    }
  };

  const stopRecording = () => {
    if (timerIntervalRef.current) {
      window.clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (speechRecRef.current) {
      try {
        speechRecRef.current.stop();
      } catch {}
      speechRecRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.requestData();
      } catch {}
      mediaRecorderRef.current.stop();
    } else {
      finalizeRecordingAudio();
    }
    setIsRecording(false);
    if (settings.soundEffects) sound.click();
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const attachValidatedFile = async (file: File) => {
    setStatusAlert(null);
    const validation = await validateUploadedFile(file);
    if (!validation.valid) {
      showTemporaryAlert(validation.error || 'Unsupported or invalid file.');
      return;
    }

    if (settings.soundEffects) sound.click();
    const processed = await processUploadedFile(file);

    // If user uploads an audio file via paperclip, also populate voiceNote preview if no voiceNote exists
    if (processed.isAudio && processed.base64 && processed.url && !voiceNote) {
      setVoiceNote({
        name: processed.name,
        size: processed.size,
        mimeType: processed.mimeType || processed.type,
        base64: processed.base64,
        url: processed.url,
        duration: 0,
      });
      return;
    }

    // Coexist Image + Document file attachments seamlessly
    if (!attachedFile) {
      setAttachedFile(processed);
    } else if (
      (attachedFile.isImage && !processed.isImage) ||
      (!attachedFile.isImage && processed.isImage)
    ) {
      setSecondaryFile(processed);
    } else {
      setAttachedFile(processed);
    }
  };

  const canSend = Boolean(text.trim() || attachedFile || secondaryFile || voiceNote);

  const handleSend = () => {
    if (!canSend || isGenerating) return;

    if (settings.soundEffects) sound.send();
    onSendMessage(text.trim(), attachedFile || undefined, {
      voiceNote: voiceNote || undefined,
      secondaryFile: secondaryFile || undefined,
      forceImageGen: isImageGenMode,
    });

    setText('');
    setAttachedFile(null);
    setSecondaryFile(null);
    setVoiceNote(null);
    setIsImageGenMode(false);

    if (textareaRef.current) {
      textareaRef.current.style.height = '48px';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (enterToSend) {
        e.preventDefault();
        handleSend();
      }
    }
    if (e.key === 'Escape' && isGenerating) {
      e.preventDefault();
      onStopGeneration();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      await attachValidatedFile(files[i]);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        await attachValidatedFile(files[i]);
      }
    }
  };

  // Paste image handler
  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          await attachValidatedFile(file);
          break;
        }
      }
    }
  };

  // Word count and char count stats
  const charCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      className="relative w-full max-w-[1050px] mx-auto transition-all"
    >
      {/* Inline Permission / File Validation Alert */}
      {statusAlert && (
        <div
          style={{
            backgroundColor: palette.colors.surface,
            borderColor: 'rgba(239, 68, 68, 0.5)',
            color: palette.colors.text,
          }}
          className="flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl mb-2 text-xs border animate-fadeIn"
        >
          <div className="flex items-center gap-2 text-red-400 font-medium">
            <AlertCircle size={14} className="shrink-0" />
            <span>{statusAlert}</span>
          </div>
          <button
            onClick={() => setStatusAlert(null)}
            className="text-slate-400 hover:text-white p-0.5"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Quick Action Chips Bar */}
      <div className="flex items-center gap-1.5 mb-2.5 overflow-x-auto pb-1 scrollbar-none">
        {QUICK_ACTIONS.map((action, i) => {
          const Icon = action.icon;
          const isActiveGen = action.isImageGen && isImageGenMode;
          return (
            <button
              key={i}
              onClick={() => {
                if (settings.soundEffects) sound.click();
                if (action.isImageGen) {
                  setIsImageGenMode((prev) => !prev);
                  if (!text.toLowerCase().startsWith('generate an image')) {
                    setText((prev) => (prev ? prev : action.prefix));
                  }
                } else {
                  setIsImageGenMode(false);
                  setText((prev) => (prev ? `${prev} ${action.prefix}` : action.prefix));
                }
                textareaRef.current?.focus();
              }}
              style={{
                backgroundColor: isActiveGen ? palette.colors.primarySubtle : palette.colors.surface,
                borderColor: isActiveGen ? palette.colors.primary : palette.colors.border,
                color: isActiveGen ? palette.colors.primary : palette.colors.text,
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border whitespace-nowrap transition-all hover:scale-105 hover:border-cyan-400 active:scale-95 shadow-sm"
            >
              <Icon size={13} style={{ color: palette.colors.primary }} />
              <span>{action.label}</span>
            </button>
          );
        })}
      </div>

      {/* Live Voice Recording Status Bar */}
      {isRecording && (
        <div
          style={{
            backgroundColor: palette.colors.surface,
            borderColor: 'rgba(239, 68, 68, 0.5)',
            boxShadow: '0 4px 18px rgba(239, 68, 68, 0.2)',
          }}
          className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl mb-2.5 text-xs border animate-fadeIn"
        >
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <span className="font-bold text-red-400">Recording Voice Note...</span>
            <span
              style={{ color: palette.colors.textMuted }}
              className="font-mono tabular-nums text-[11px]"
            >
              {formatDuration(recordingSeconds)}
            </span>
          </div>
          <button
            type="button"
            onClick={stopRecording}
            className="px-3 py-1 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 font-semibold transition-colors flex items-center gap-1.5"
          >
            <Square size={11} className="fill-red-400" />
            <span>Stop & Preview</span>
          </button>
        </div>
      )}

      {/* Recorded Voice Note Preview Card */}
      {voiceNote && !isRecording && (
        <div
          style={{
            backgroundColor: palette.colors.surface,
            borderColor: palette.colors.borderHighlight,
            boxShadow: `0 4px 18px ${palette.colors.glow}`,
          }}
          className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl mb-2.5 text-xs border animate-fadeIn"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              style={{
                backgroundColor: palette.colors.primarySubtle,
                color: palette.colors.primary,
              }}
              className="w-9 h-9 rounded-lg flex items-center justify-center font-bold shrink-0"
            >
              <Volume2 size={17} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold truncate">
                Voice Note {voiceNote.duration ? `(${formatDuration(voiceNote.duration)})` : ''}
              </span>
              <span style={{ color: palette.colors.textMuted }} className="text-[11px] font-mono">
                {formatFileSize(voiceNote.size)} · Ready for Neural Transcription
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <audio
              controls
              src={voiceNote.url}
              className="h-8 max-w-[190px] sm:max-w-[240px]"
            />
            <button
              type="button"
              onClick={() => {
                if (settings.soundEffects) sound.click();
                setVoiceNote(null);
              }}
              className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              title="Remove voice note"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Primary Attached File / Image Preview Card */}
      {attachedFile && (
        <div
          style={{
            backgroundColor: palette.colors.surface,
            borderColor: palette.colors.borderHighlight,
            boxShadow: `0 4px 18px ${palette.colors.glow}`,
          }}
          className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl mb-2.5 text-xs border animate-fadeIn"
        >
          <div className="flex items-center gap-3 min-w-0">
            {attachedFile.isImage && attachedFile.url ? (
              <img
                src={attachedFile.url}
                alt="Upload preview"
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-lg object-cover border border-white/20 shadow-sm"
              />
            ) : (
              <div
                style={{
                  backgroundColor: palette.colors.primarySubtle,
                  color: palette.colors.primary,
                }}
                className="w-10 h-10 rounded-lg flex items-center justify-center font-bold"
              >
                <FileText size={18} />
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <span className="font-bold truncate max-w-[260px] sm:max-w-md">
                {attachedFile.name}
              </span>
              <span style={{ color: palette.colors.textMuted }} className="text-[11px] font-mono">
                {formatFileSize(attachedFile.size)} ·{' '}
                {attachedFile.isImage ? 'Ready for Vision Analysis / Reference' : 'Ready for Neural Analysis'}
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              if (settings.soundEffects) sound.click();
              setAttachedFile(secondaryFile);
              setSecondaryFile(null);
            }}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            title="Remove attachment"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Secondary Attached File / Image Preview Card (when combining Image + File) */}
      {secondaryFile && (
        <div
          style={{
            backgroundColor: palette.colors.surface,
            borderColor: palette.colors.borderHighlight,
            boxShadow: `0 4px 18px ${palette.colors.glow}`,
          }}
          className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl mb-2.5 text-xs border animate-fadeIn"
        >
          <div className="flex items-center gap-3 min-w-0">
            {secondaryFile.isImage && secondaryFile.url ? (
              <img
                src={secondaryFile.url}
                alt="Upload preview"
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-lg object-cover border border-white/20 shadow-sm"
              />
            ) : (
              <div
                style={{
                  backgroundColor: palette.colors.primarySubtle,
                  color: palette.colors.primary,
                }}
                className="w-10 h-10 rounded-lg flex items-center justify-center font-bold"
              >
                <FileText size={18} />
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <span className="font-bold truncate max-w-[260px] sm:max-w-md">
                {secondaryFile.name}
              </span>
              <span style={{ color: palette.colors.textMuted }} className="text-[11px] font-mono">
                {formatFileSize(secondaryFile.size)} · Ready for Neural Analysis
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              if (settings.soundEffects) sound.click();
              setSecondaryFile(null);
            }}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            title="Remove attachment"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Outer Glowing Gradient Ring */}
      <div
        style={{
          background: palette.colors.ring,
          boxShadow: isDragOver
            ? `0 0 35px ${palette.colors.glow}, 0 10px 40px rgba(0,0,0,0.6)`
            : `0 10px 35px rgba(0,0,0,0.45)`,
        }}
        className="p-[1.5px] rounded-[30px] transition-all hover:brightness-105"
      >
        {/* Inner Composer Body */}
        <div
          style={{
            backgroundColor: palette.colors.surface,
            color: palette.colors.text,
          }}
          className="flex items-end gap-2 px-3.5 py-2 rounded-[28.5px] transition-colors"
        >
          {/* File Attachment Button */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileChange}
            accept={SUPPORTED_EXTENSIONS.map((e) => `.${e}`).join(',')}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => {
              if (settings.soundEffects) sound.click();
              fileInputRef.current?.click();
            }}
            disabled={isGenerating}
            style={{ color: palette.colors.textMuted }}
            className="p-2.5 rounded-full hover:text-cyan-400 hover:bg-white/5 transition-all shrink-0"
            title="Attach file (PDF, DOCX, XLSX, CSV, Code, Images, Audio)"
          >
            <Paperclip size={19} />
          </button>

          {/* Text Area */}
          <div className="flex-1 flex flex-col min-w-0">
            <textarea
              ref={textareaRef}
              rows={1}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={
                isImageGenMode
                  ? 'Describe the image to generate... (Enter = send, Shift+Enter = new line)'
                  : 'Message NEXUS AI...  (Enter = send, Shift+Enter = new line)'
              }
              disabled={isGenerating}
              style={{ color: palette.colors.text }}
              className="w-full py-2.5 px-2 bg-transparent resize-none focus:outline-none text-sm font-medium leading-relaxed max-h-[180px] placeholder:opacity-50"
            />
          </div>

          {/* Right Action Icons: Stats, Microphone & Send/Stop */}
          <div className="flex items-center gap-2 shrink-0 mb-1">
            {/* Real-time word / char badge when typing */}
            {charCount > 0 && (
              <span
                style={{ color: palette.colors.textMuted }}
                className="hidden sm:inline text-[10px] font-mono tabular-nums opacity-60 mr-1"
              >
                {wordCount}w · {charCount}c
              </span>
            )}

            {/* Microphone Voice Note Button */}
            <button
              type="button"
              onClick={toggleRecording}
              disabled={isGenerating}
              style={{
                backgroundColor: isRecording ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
                color: isRecording ? '#EF4444' : palette.colors.textMuted,
              }}
              className={`p-2 rounded-full transition-all hover:text-white hover:bg-white/5 ${
                isRecording ? 'animate-pulse' : ''
              }`}
              title={isRecording ? 'Stop recording voice note' : 'Record voice note'}
            >
              {isRecording ? <MicOff size={19} /> : <Mic size={19} />}
            </button>

            {/* Send OR Stop Generation Button */}
            {isGenerating ? (
              <button
                type="button"
                onClick={() => {
                  if (settings.soundEffects) sound.click();
                  onStopGeneration();
                }}
                className="w-10 h-10 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-600/40 transition-all hover:scale-105 active:scale-95"
                title="Stop generating (Esc)"
              >
                <Square size={14} className="fill-white" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSend}
                disabled={!canSend}
                style={{
                  background: canSend ? palette.colors.ring : 'rgba(255,255,255,0.06)',
                  boxShadow: canSend ? `0 4px 20px ${palette.colors.glow}` : 'none',
                }}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  canSend
                    ? 'text-white hover:scale-105 active:scale-95 cursor-pointer hover:brightness-110'
                    : 'text-slate-600 cursor-not-allowed opacity-40'
                }`}
                title="Send message"
              >
                <Send size={16} strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
