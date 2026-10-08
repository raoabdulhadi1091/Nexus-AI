import React, { useState, useRef } from 'react';
import {
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  Volume2,
  VolumeX,
  Trash2,
  RotateCw,
  FileText,
  Share2,
  Eye,
  ExternalLink,
  ImagePlus,
  MessageSquarePlus,
  Mic,
} from 'lucide-react';
import { ChatMessage as ChatMessageType, AppSettings } from '../types';
import { renderMarkdown, formatTimestamp } from '../utils/markdown';
import { getPalette } from '../utils/themePalettes';
import { sound } from '../utils/soundEffects';
import { synthesizeSpeech } from '../utils/api';

interface ChatMessageProps {
  message: ChatMessageType;
  index: number;
  fontSize: number;
  settings: AppSettings;
  isLastAssistant: boolean;
  isGenerating: boolean;
  onFeedback: (index: number, feedback: 'up' | 'down') => void;
  onDeleteMessage: (index: number) => void;
  onRegenerate?: () => void;
  onRegenerateImage?: (message: ChatMessageType) => void;
  onUseImageAsReference?: (imageB64: string, mimeType: string) => void;
  onAskAboutImage?: (imageB64: string, mimeType: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  index,
  fontSize,
  settings,
  isLastAssistant,
  isGenerating,
  onFeedback,
  onDeleteMessage,
  onRegenerate,
  onRegenerateImage,
  onUseImageAsReference,
  onAskAboutImage,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPreparingAudio, setIsPreparingAudio] = useState(false);
  const [modalImageSrc, setModalImageSrc] = useState<string | null>(null);
  const [shared, setShared] = useState(false);

  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const isUser = message.role === 'user';
  const timestamp = formatTimestamp(message.ts);
  const palette = getPalette(settings.palette);

  const uploadedImageSrc = message.image_b64
    ? `data:${message.image_mime_type || 'image/png'};base64,${message.image_b64}`
    : null;

  const generatedImageSrc = message.generated_image_b64
    ? `data:${message.generated_image_mime || 'image/png'};base64,${message.generated_image_b64}`
    : null;

  const voiceAudioSrc = message.audio_b64
    ? `data:${message.audio_mime_type || 'audio/webm'};base64,${message.audio_b64}`
    : null;

  const handleCopy = () => {
    if (settings.soundEffects) sound.click();
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (settings.soundEffects) sound.click();
    if (navigator.share) {
      navigator
        .share({
          title: 'NEXUS AI Response',
          text: message.content,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(message.content);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  const stopAudioPlayback = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.currentTime = 0;
      audioPlayerRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsPreparingAudio(false);
  };

  const handleSpeak = async () => {
    if (isSpeaking || isPreparingAudio) {
      stopAudioPlayback();
      return;
    }

    if (settings.soundEffects) sound.click();
    setIsPreparingAudio(true);

    try {
      const ttsResult = await synthesizeSpeech(message.content);
      if (ttsResult.status === 'ok' && ttsResult.audioBase64) {
        const audio = new Audio(
          `data:${ttsResult.mimeType || 'audio/wav'};base64,${ttsResult.audioBase64}`
        );
        audio.playbackRate = settings.ttsRate || 1.0;
        audioPlayerRef.current = audio;
        audio.onended = () => {
          setIsSpeaking(false);
          audioPlayerRef.current = null;
        };
        audio.onerror = () => {
          setIsSpeaking(false);
          audioPlayerRef.current = null;
        };
        setIsPreparingAudio(false);
        setIsSpeaking(true);
        await audio.play();
        return;
      }
    } catch {
      // Fallback to browser speechSynthesis below
    }

    setIsPreparingAudio(false);
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    const cleanText = message.content.replace(/[*_#`[\]()]/g, ' ').replace(/\s+/g, ' ');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = settings.ttsRate || 1.0;
    utterance.pitch = settings.ttsPitch || 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleOpenOrDownloadImage = (dataUrl: string) => {
    if (settings.soundEffects) sound.click();
    try {
      const parts = dataUrl.split(',');
      const mimeMatch = parts[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'image/png';
      const ext = mime.split('/')[1] || 'png';
      const binary = atob(parts[1]);
      const array = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        array[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([array], { type: mime });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `nexus-ai-image-${Date.now()}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
    } catch {
      setModalImageSrc(dataUrl);
    }
  };

  return (
    <div className={`w-full py-2.5 flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
      {/* Message Container with dynamic palette contrast */}
      <div
        style={{
          background: isUser ? palette.colors.userBubble : palette.colors.assistantBubble,
          borderColor: isUser ? palette.colors.borderHighlight : palette.colors.border,
          boxShadow: isUser
            ? `0 4px 20px ${palette.colors.glow}`
            : `0 4px 18px rgba(0,0,0,0.35)`,
          color: palette.colors.text,
        }}
        className={`relative max-w-[92%] sm:max-w-[82%] rounded-2xl p-4 sm:p-5 border transition-all
          ${isUser ? 'rounded-br-sm' : 'rounded-bl-sm'}
        `}
      >
        {/* Header Label: Role + Timestamp */}
        <div className="flex items-center justify-between gap-3 mb-2 text-[11px] font-bold tracking-wider">
          <div className="flex items-center gap-1.5 opacity-80">
            <span style={{ color: isUser ? '#FFFFFF' : palette.colors.primary }}>
              {isUser ? 'YOU' : '✦ NEXUS AI'}
            </span>
            {timestamp && (
              <>
                <span className="opacity-50">·</span>
                <span className="font-mono tabular-nums opacity-90">{timestamp}</span>
              </>
            )}
          </div>

          {/* User Quick Copy */}
          {isUser && (
            <button
              onClick={handleCopy}
              className="opacity-75 hover:opacity-100 transition-opacity p-0.5"
              title="Copy message"
            >
              {copied ? <Check size={12} className="text-emerald-300" /> : <Copy size={12} />}
            </button>
          )}
        </div>

        {/* Attached Image Thumbnail */}
        {uploadedImageSrc && (
          <div className="mb-3">
            <img
              src={uploadedImageSrc}
              alt="Attached content"
              referrerPolicy="no-referrer"
              onClick={() => setModalImageSrc(uploadedImageSrc)}
              className="max-w-[280px] max-h-[220px] rounded-xl border border-white/20 object-cover cursor-pointer hover:opacity-90 hover:scale-[1.01] transition-all shadow-md"
            />
          </div>
        )}

        {/* Voice Note Audio Player Badge */}
        {message.is_voice_note && (
          <div
            style={{
              backgroundColor: isUser ? 'rgba(0, 0, 0, 0.25)' : palette.colors.surfaceHover,
              borderColor: palette.colors.border,
            }}
            className="flex flex-wrap items-center gap-2.5 p-2.5 rounded-xl mb-3 text-xs border"
          >
            <div
              style={{
                backgroundColor: palette.colors.primarySubtle,
                color: palette.colors.primary,
              }}
              className="p-1.5 rounded-lg shrink-0"
            >
              <Mic size={15} />
            </div>
            <div className="flex flex-col min-w-0 mr-2">
              <span className="font-semibold">Voice Note</span>
              <span style={{ color: palette.colors.textMuted }} className="text-[10px]">
                Transcribed by NEXUS AI
              </span>
            </div>
            {voiceAudioSrc && (
              <audio
                controls
                src={voiceAudioSrc}
                className="h-7 max-w-[180px] sm:max-w-[220px] ml-auto"
              />
            )}
          </div>
        )}

        {/* Attached File Card */}
        {message.file_info && (
          <div
            style={{
              backgroundColor: isUser ? 'rgba(0, 0, 0, 0.25)' : palette.colors.surfaceHover,
              borderColor: palette.colors.border,
            }}
            className="flex items-center gap-2.5 p-2.5 rounded-xl mb-3 text-xs border"
          >
            <div
              style={{
                backgroundColor: palette.colors.primarySubtle,
                color: palette.colors.primary,
              }}
              className="p-1.5 rounded-lg"
            >
              <FileText size={16} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-semibold truncate">{message.file_info}</span>
              <span style={{ color: palette.colors.textMuted }} className="text-[10px]">
                Processed by NEXUS AI
              </span>
            </div>
          </div>
        )}

        {/* Generated Image Output + Actions inside Assistant Bubble */}
        {generatedImageSrc && (
          <div className="mb-3.5 space-y-2.5">
            <div className="relative group inline-block">
              <img
                src={generatedImageSrc}
                alt={message.generated_prompt || 'Generated by NEXUS AI'}
                referrerPolicy="no-referrer"
                onClick={() => setModalImageSrc(generatedImageSrc)}
                className="max-w-full sm:max-w-[420px] max-h-[420px] rounded-2xl border border-white/15 object-contain cursor-pointer hover:opacity-95 transition-all shadow-lg"
              />
            </div>

            {/* Generated Image Actions (View, Open, Regenerate, Use as reference, Ask about image) */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <button
                type="button"
                onClick={() => {
                  if (settings.soundEffects) sound.click();
                  setModalImageSrc(generatedImageSrc);
                }}
                style={{
                  backgroundColor: palette.colors.surfaceHover,
                  borderColor: palette.colors.border,
                  color: palette.colors.text,
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all hover:border-cyan-400 hover:scale-105"
              >
                <Eye size={12} style={{ color: palette.colors.primary }} />
                <span>View</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenOrDownloadImage(generatedImageSrc)}
                style={{
                  backgroundColor: palette.colors.surfaceHover,
                  borderColor: palette.colors.border,
                  color: palette.colors.text,
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all hover:border-cyan-400 hover:scale-105"
              >
                <ExternalLink size={12} style={{ color: palette.colors.primary }} />
                <span>Open</span>
              </button>

              {onRegenerateImage && (
                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={() => {
                    if (settings.soundEffects) sound.click();
                    onRegenerateImage(message);
                  }}
                  style={{
                    backgroundColor: palette.colors.surfaceHover,
                    borderColor: palette.colors.border,
                    color: palette.colors.text,
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all hover:border-cyan-400 hover:scale-105 disabled:opacity-50"
                >
                  <RotateCw size={12} style={{ color: palette.colors.primary }} />
                  <span>Regenerate</span>
                </button>
              )}

              {onUseImageAsReference && message.generated_image_b64 && (
                <button
                  type="button"
                  onClick={() => {
                    if (settings.soundEffects) sound.click();
                    onUseImageAsReference(
                      message.generated_image_b64!,
                      message.generated_image_mime || 'image/png'
                    );
                  }}
                  style={{
                    backgroundColor: palette.colors.surfaceHover,
                    borderColor: palette.colors.border,
                    color: palette.colors.text,
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all hover:border-cyan-400 hover:scale-105"
                >
                  <ImagePlus size={12} style={{ color: palette.colors.primary }} />
                  <span>Use as reference</span>
                </button>
              )}

              {onAskAboutImage && message.generated_image_b64 && (
                <button
                  type="button"
                  onClick={() => {
                    if (settings.soundEffects) sound.click();
                    onAskAboutImage(
                      message.generated_image_b64!,
                      message.generated_image_mime || 'image/png'
                    );
                  }}
                  style={{
                    backgroundColor: palette.colors.surfaceHover,
                    borderColor: palette.colors.border,
                    color: palette.colors.text,
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all hover:border-cyan-400 hover:scale-105"
                >
                  <MessageSquarePlus size={12} style={{ color: palette.colors.primary }} />
                  <span>Ask about image</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Message Content */}
        {isUser ? (
          <div
            style={{ fontSize: `${fontSize}px` }}
            className="whitespace-pre-wrap leading-relaxed break-words font-sans text-white"
          >
            {message.content}
          </div>
        ) : (
          <div
            style={{ fontSize: `${fontSize}px` }}
            className="nexus-markdown leading-relaxed break-words"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
          />
        )}
      </div>

      {/* Assistant Action Row (Exact 28x28 matching master app.py requirements) */}
      {!isUser && (
        <div className="flex items-center gap-1.5 mt-2 px-1">
          {/* Copy Button */}
          <button
            onClick={handleCopy}
            style={{
              backgroundColor: palette.colors.surface,
              borderColor: palette.colors.border,
              color: copied ? palette.colors.accent : palette.colors.textMuted,
            }}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-xs border transition-all hover:scale-105"
            title="Copy response"
          >
            {copied ? <Check size={13} strokeWidth={2.5} /> : <Copy size={13} />}
          </button>

          {/* Thumbs Up Feedback */}
          <button
            onClick={() => {
              if (settings.soundEffects) sound.click();
              onFeedback(index, 'up');
            }}
            style={{
              backgroundColor:
                message.feedback === 'up' ? palette.colors.primarySubtle : palette.colors.surface,
              borderColor:
                message.feedback === 'up' ? palette.colors.borderHighlight : palette.colors.border,
              color: message.feedback === 'up' ? palette.colors.primary : palette.colors.textMuted,
            }}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-xs border transition-all hover:scale-105"
            title="Helpful response"
          >
            <ThumbsUp size={13} />
          </button>

          {/* Thumbs Down Feedback */}
          <button
            onClick={() => {
              if (settings.soundEffects) sound.click();
              onFeedback(index, 'down');
            }}
            style={{
              backgroundColor:
                message.feedback === 'down' ? 'rgba(239, 68, 68, 0.15)' : palette.colors.surface,
              borderColor:
                message.feedback === 'down' ? 'rgba(239, 68, 68, 0.4)' : palette.colors.border,
              color: message.feedback === 'down' ? '#EF4444' : palette.colors.textMuted,
            }}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-xs border transition-all hover:scale-105"
            title="Not helpful"
          >
            <ThumbsDown size={13} />
          </button>

          {/* Text-to-Speech (TTS) */}
          <button
            onClick={handleSpeak}
            style={{
              backgroundColor:
                isSpeaking || isPreparingAudio ? palette.colors.primarySubtle : palette.colors.surface,
              borderColor:
                isSpeaking || isPreparingAudio ? palette.colors.borderHighlight : palette.colors.border,
              color:
                isSpeaking || isPreparingAudio ? palette.colors.primary : palette.colors.textMuted,
            }}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-xs border transition-all hover:scale-105"
            title={
              isPreparingAudio
                ? 'Preparing audio...'
                : isSpeaking
                  ? 'Stop speaking'
                  : 'Read aloud with TTS'
            }
          >
            {isSpeaking ? <VolumeX size={13} /> : <Volume2 size={13} />}
          </button>

          {/* Share Response */}
          <button
            onClick={handleShare}
            style={{
              backgroundColor: palette.colors.surface,
              borderColor: palette.colors.border,
              color: shared ? palette.colors.accent : palette.colors.textMuted,
            }}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-xs border transition-all hover:scale-105"
            title="Share or copy response"
          >
            {shared ? <Check size={13} /> : <Share2 size={13} />}
          </button>

          {/* Regenerate (if last response) */}
          {isLastAssistant && onRegenerate && !isGenerating && (
            <button
              onClick={() => {
                if (settings.soundEffects) sound.click();
                onRegenerate();
              }}
              style={{
                backgroundColor: palette.colors.surface,
                borderColor: palette.colors.border,
                color: palette.colors.primary,
              }}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-xs border transition-all hover:scale-105"
              title="Regenerate response"
            >
              <RotateCw size={13} />
            </button>
          )}

          {/* Delete Message */}
          <button
            onClick={() => {
              if (settings.soundEffects) sound.click();
              onDeleteMessage(index);
            }}
            style={{
              backgroundColor: palette.colors.surface,
              borderColor: palette.colors.border,
            }}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-xs border text-slate-400 hover:text-red-400 hover:border-red-500/30 transition-all hover:scale-105"
            title="Delete this message"
          >
            <Trash2 size={13} />
          </button>

          {/* Loading status for TTS ("Preparing audio...") */}
          {isPreparingAudio && (
            <span
              style={{ color: palette.colors.primary }}
              className="text-[11px] font-mono ml-1.5 animate-pulse"
            >
              Preparing audio...
            </span>
          )}
        </div>
      )}

      {/* Image Modal Lightbox */}
      {modalImageSrc && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-md"
          onClick={() => setModalImageSrc(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <img
              src={modalImageSrc}
              alt="Full size view"
              referrerPolicy="no-referrer"
              className="max-w-full max-h-[90vh] rounded-2xl object-contain shadow-2xl border border-white/10"
            />
            <button
              onClick={() => setModalImageSrc(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/70 text-white hover:bg-black font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
