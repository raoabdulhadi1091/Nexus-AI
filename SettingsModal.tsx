import React, { useState, useEffect } from 'react';
import {
  X,
  Sliders,
  Palette,
  Bot,
  FileCheck,
  Activity,
  Info,
  Check,
  RefreshCw,
  Volume2,
  VolumeX,
  Sparkles,
} from 'lucide-react';
import { AppSettings, ReplyMode, ThemePalette } from '../types';
import { checkServerStatus } from '../utils/api';
import { SUPPORTED_EXTENSIONS } from '../utils/fileExtractor';
import { PALETTES, getPalette } from '../utils/themePalettes';
import { sound } from '../utils/soundEffects';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'palettes' | 'modes' | 'audio' | 'files' | 'connection' | 'about'>('palettes');
  const [serverInfo, setServerInfo] = useState<any>(null);
  const [isCheckingServer, setIsCheckingServer] = useState(false);

  const palette = getPalette(settings.palette);
  const isWebhookReachable = /^HTTP 2\d\d$/.test(serverInfo?.webhookStatus || '');

  useEffect(() => {
    if (isOpen) {
      loadStatus();
    }
  }, [isOpen]);

  const loadStatus = async () => {
    setIsCheckingServer(true);
    const info = await checkServerStatus();
    setServerInfo(info);
    setIsCheckingServer(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        style={{
          backgroundColor: palette.colors.surface,
          borderColor: palette.colors.borderHighlight,
          boxShadow: `0 25px 80px rgba(0,0,0,0.7), 0 0 50px ${palette.colors.glow}`,
          color: palette.colors.text,
        }}
        className="w-full max-w-2xl rounded-3xl border flex flex-col overflow-hidden max-h-[88vh]"
      >
        {/* Modal Header */}
        <div
          style={{ borderColor: palette.colors.border }}
          className="flex items-center justify-between px-6 py-4 border-b"
        >
          <div className="flex items-center gap-2.5">
            <span style={{ color: palette.colors.primary }} className="font-bold text-lg">✦</span>
            <h2 className="font-bold text-base tracking-wide font-heading">Workspace Settings</h2>
          </div>
          <button
            onClick={() => {
              if (settings.soundEffects) sound.click();
              onClose();
            }}
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          style={{ borderColor: palette.colors.border }}
          className="flex border-b px-6 gap-6 text-xs font-bold overflow-x-auto scrollbar-none"
        >
          <button
            onClick={() => {
              if (settings.soundEffects) sound.click();
              setActiveTab('palettes');
            }}
            style={{
              borderColor: activeTab === 'palettes' ? palette.colors.primary : 'transparent',
              color: activeTab === 'palettes' ? palette.colors.primary : palette.colors.textMuted,
            }}
            className="py-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap"
          >
            <Palette size={14} />
            <span>Color Palettes</span>
          </button>

          <button
            onClick={() => {
              if (settings.soundEffects) sound.click();
              setActiveTab('modes');
            }}
            style={{
              borderColor: activeTab === 'modes' ? palette.colors.primary : 'transparent',
              color: activeTab === 'modes' ? palette.colors.primary : palette.colors.textMuted,
            }}
            className="py-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap"
          >
            <Bot size={14} />
            <span>Reply Modes</span>
          </button>

          <button
            onClick={() => {
              if (settings.soundEffects) sound.click();
              setActiveTab('audio');
            }}
            style={{
              borderColor: activeTab === 'audio' ? palette.colors.primary : 'transparent',
              color: activeTab === 'audio' ? palette.colors.primary : palette.colors.textMuted,
            }}
            className="py-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap"
          >
            <Volume2 size={14} />
            <span>Voice & Sound FX</span>
          </button>

          <button
            onClick={() => {
              if (settings.soundEffects) sound.click();
              setActiveTab('files');
            }}
            style={{
              borderColor: activeTab === 'files' ? palette.colors.primary : 'transparent',
              color: activeTab === 'files' ? palette.colors.primary : palette.colors.textMuted,
            }}
            className="py-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap"
          >
            <FileCheck size={14} />
            <span>Files & Specs</span>
          </button>

          <button
            onClick={() => {
              if (settings.soundEffects) sound.click();
              setActiveTab('connection');
            }}
            style={{
              borderColor: activeTab === 'connection' ? palette.colors.primary : 'transparent',
              color: activeTab === 'connection' ? palette.colors.primary : palette.colors.textMuted,
            }}
            className="py-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap"
          >
            <Activity size={14} />
            <span>n8n Status</span>
          </button>

          <button
            onClick={() => {
              if (settings.soundEffects) sound.click();
              setActiveTab('about');
            }}
            style={{
              borderColor: activeTab === 'about' ? palette.colors.primary : 'transparent',
              color: activeTab === 'about' ? palette.colors.primary : palette.colors.textMuted,
            }}
            className="py-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap"
          >
            <Info size={14} />
            <span>About</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* 1. Color Palettes Tab */}
          {activeTab === 'palettes' && (
            <div className="space-y-5">
              <div>
                <label
                  style={{ color: palette.colors.textMuted }}
                  className="block text-xs font-bold uppercase tracking-wider mb-3"
                >
                  Choose High-Contrast Visual Theme
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(Object.keys(PALETTES) as ThemePalette[]).map((key) => {
                    const pal = PALETTES[key];
                    const isSelected = settings.palette === key;
                    return (
                      <div
                        key={key}
                        onClick={() => {
                          if (settings.soundEffects) sound.click();
                          onUpdateSettings({
                            palette: key,
                            theme: pal.isLight ? 'light' : 'dark',
                          });
                        }}
                        style={{
                          backgroundColor: pal.colors.surface,
                          borderColor: isSelected ? pal.colors.primary : pal.colors.border,
                          boxShadow: isSelected ? `0 0 20px ${pal.colors.glow}` : 'none',
                        }}
                        className="p-4 rounded-2xl border-2 cursor-pointer transition-all hover:scale-[1.02] flex flex-col justify-between gap-3 relative overflow-hidden"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span
                              style={{ backgroundColor: pal.colors.primary }}
                              className="w-4 h-4 rounded-full shadow"
                            />
                            <span
                              style={{ color: pal.colors.text }}
                              className="font-bold text-xs"
                            >
                              {pal.name}
                            </span>
                          </div>
                          {isSelected && (
                            <span
                              style={{ color: pal.colors.primary }}
                              className="font-bold text-xs"
                            >
                              <Check size={16} strokeWidth={3} />
                            </span>
                          )}
                        </div>

                        <p
                          style={{ color: pal.colors.textMuted }}
                          className="text-[11px] leading-relaxed"
                        >
                          {pal.tagline}
                        </p>

                        {/* Visual swatch bar */}
                        <div className="flex items-center gap-1.5 pt-1">
                          <div
                            style={{ backgroundColor: pal.colors.bg }}
                            className="h-3 w-8 rounded border border-white/20"
                            title="Background"
                          />
                          <div
                            style={{ backgroundColor: pal.colors.surface }}
                            className="h-3 w-8 rounded border border-white/20"
                            title="Surface"
                          />
                          <div
                            style={{ backgroundColor: pal.colors.primary }}
                            className="h-3 w-8 rounded"
                            title="Primary Accent"
                          />
                          <div
                            style={{ backgroundColor: pal.colors.accent }}
                            className="h-3 w-8 rounded"
                            title="Secondary Accent"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Font Size Adjuster */}
              <div
                style={{ borderColor: palette.colors.border }}
                className="pt-4 border-t"
              >
                <div className="flex items-center justify-between mb-2">
                  <label
                    style={{ color: palette.colors.textMuted }}
                    className="text-xs font-bold uppercase tracking-wider"
                  >
                    Workspace Typography Scale
                  </label>
                  <span
                    style={{ color: palette.colors.primary }}
                    className="font-mono text-xs font-bold tabular-nums"
                  >
                    {settings.fontSize}px
                  </span>
                </div>
                <input
                  type="range"
                  min="12"
                  max="20"
                  value={settings.fontSize}
                  onChange={(e) => onUpdateSettings({ fontSize: parseInt(e.target.value, 10) })}
                  style={{ accentColor: palette.colors.primary }}
                  className="w-full cursor-pointer"
                />
                <div
                  style={{ color: palette.colors.textMuted }}
                  className="flex justify-between text-[10px] mt-1 font-mono"
                >
                  <span>12px (Dense)</span>
                  <span>15px (Balanced)</span>
                  <span>20px (Spacious)</span>
                </div>
              </div>

              {/* Enter to Send Toggle */}
              <div
                style={{ borderColor: palette.colors.border }}
                className="flex items-center justify-between pt-3 border-t"
              >
                <div>
                  <div className="font-bold text-xs">Press Enter to Send</div>
                  <div style={{ color: palette.colors.textMuted }} className="text-[11px]">
                    Use Shift+Enter for clean multiline breaks
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enterToSend}
                  onChange={(e) => onUpdateSettings({ enterToSend: e.target.checked })}
                  style={{ accentColor: palette.colors.primary }}
                  className="w-4 h-4 rounded cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* 2. Reply Modes Tab */}
          {activeTab === 'modes' && (
            <div className="space-y-4">
              <p style={{ color: palette.colors.textMuted }} className="text-xs">
                Select your default system instruction persona for all new sessions:
              </p>

              <div className="space-y-3">
                {[
                  {
                    id: 'General' as ReplyMode,
                    title: 'General Mode',
                    prompt: 'Standard balanced AI response behavior without specialized prefix.',
                  },
                  {
                    id: 'Coder' as ReplyMode,
                    title: 'Coder Mode',
                    prompt: 'Act as an expert programmer. Answer with clean, working code and a brief explanation.',
                  },
                  {
                    id: 'Writer' as ReplyMode,
                    title: 'Writer Mode',
                    prompt: 'Act as a professional writer. Focus on tone, clarity and structure.',
                  },
                  {
                    id: 'Translator' as ReplyMode,
                    title: 'Translator Mode',
                    prompt: "Act as a translator. Translate the user's text unless asked otherwise.",
                  },
                  {
                    id: 'Roman Urdu' as ReplyMode,
                    title: 'Roman Urdu Mode',
                    prompt: "Reply in Roman Urdu (Urdu/Hindi written in English script) unless the user asks for another language.",
                  },
                ].map((mode) => (
                  <div
                    key={mode.id}
                    onClick={() => {
                      if (settings.soundEffects) sound.click();
                      onUpdateSettings({ defaultMode: mode.id });
                    }}
                    style={{
                      backgroundColor: palette.colors.surfaceHover,
                      borderColor:
                        settings.defaultMode === mode.id
                          ? palette.colors.primary
                          : palette.colors.border,
                      boxShadow:
                        settings.defaultMode === mode.id
                          ? `0 0 15px ${palette.colors.glow}`
                          : 'none',
                    }}
                    className="p-4 rounded-2xl border cursor-pointer transition-all flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="font-bold text-xs flex items-center gap-2">
                        <span>{mode.title}</span>
                        {settings.defaultMode === mode.id && (
                          <span
                            style={{
                              backgroundColor: palette.colors.primarySubtle,
                              color: palette.colors.primary,
                            }}
                            className="text-[10px] font-mono px-1.5 py-0.5 rounded font-bold"
                          >
                            DEFAULT
                          </span>
                        )}
                      </div>
                      <div
                        style={{ color: palette.colors.textMuted }}
                        className="text-xs mt-1 leading-relaxed"
                      >
                        {mode.prompt}
                      </div>
                    </div>
                    {settings.defaultMode === mode.id && (
                      <Check size={16} style={{ color: palette.colors.primary }} className="shrink-0 mt-0.5" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Audio & Sound FX Tab */}
          {activeTab === 'audio' && (
            <div className="space-y-5">
              {/* Sound FX Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs">Micro-Interaction Sound Effects</div>
                  <div style={{ color: palette.colors.textMuted }} className="text-[11px]">
                    Futuristic audio cues when sending, receiving, and clicking buttons
                  </div>
                </div>
                <button
                  onClick={() => {
                    const next = !settings.soundEffects;
                    if (next) sound.click();
                    onUpdateSettings({ soundEffects: next });
                  }}
                  style={{
                    backgroundColor: settings.soundEffects
                      ? palette.colors.primary
                      : palette.colors.surfaceHover,
                    color: settings.soundEffects ? '#FFFFFF' : palette.colors.textMuted,
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  {settings.soundEffects ? 'Sound FX Enabled' : 'Muted'}
                </button>
              </div>

              {/* TTS Speech Rate & Pitch */}
              <div
                style={{ borderColor: palette.colors.border }}
                className="pt-4 border-t space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      style={{ color: palette.colors.textMuted }}
                      className="text-xs font-bold uppercase tracking-wider"
                    >
                      Text-to-Speech Speed
                    </label>
                    <span
                      style={{ color: palette.colors.primary }}
                      className="font-mono text-xs font-bold tabular-nums"
                    >
                      {settings.ttsRate}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.75"
                    max="1.5"
                    step="0.05"
                    value={settings.ttsRate}
                    onChange={(e) => onUpdateSettings({ ttsRate: parseFloat(e.target.value) })}
                    style={{ accentColor: palette.colors.primary }}
                    className="w-full cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      style={{ color: palette.colors.textMuted }}
                      className="text-xs font-bold uppercase tracking-wider"
                    >
                      Text-to-Speech Pitch
                    </label>
                    <span
                      style={{ color: palette.colors.primary }}
                      className="font-mono text-xs font-bold tabular-nums"
                    >
                      {settings.ttsPitch}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.8"
                    max="1.3"
                    step="0.05"
                    value={settings.ttsPitch}
                    onChange={(e) => onUpdateSettings({ ttsPitch: parseFloat(e.target.value) })}
                    style={{ accentColor: palette.colors.primary }}
                    className="w-full cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 4. Files & Specs Tab */}
          {activeTab === 'files' && (
            <div className="space-y-4">
              <div style={{ color: palette.colors.textMuted }} className="text-xs">
                NEXUS AI parses and accepts 16+ file types natively up to 200MB:
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SUPPORTED_EXTENSIONS.map((ext) => (
                  <div
                    key={ext}
                    style={{
                      backgroundColor: palette.colors.surfaceHover,
                      borderColor: palette.colors.border,
                      color: palette.colors.primary,
                    }}
                    className="p-2.5 rounded-xl border text-center text-xs font-mono font-bold"
                  >
                    .{ext}
                  </div>
                ))}
              </div>

              <div
                style={{
                  backgroundColor: palette.colors.surfaceHover,
                  borderColor: palette.colors.border,
                }}
                className="p-4 rounded-2xl border text-xs space-y-2"
              >
                <div className="font-bold text-white">Multimodal Handling Rules:</div>
                <ul
                  style={{ color: palette.colors.textMuted }}
                  className="list-disc pl-4 space-y-1.5 text-[11px]"
                >
                  <li>
                    <strong className="text-white">Documents (.pdf, .docx, .xlsx, .csv):</strong> Ingestion extracts textual data into tagged delimiters for analysis.
                  </li>
                  <li>
                    <strong className="text-white">Code & Text (.py, .json, .md, .txt):</strong> Read with syntax preservation.
                  </li>
                  <li>
                    <strong className="text-white">Images (.png, .jpg, .webp):</strong> Full thumbnail preview in chat + lightbox expansion.
                  </li>
                  <li>
                    <strong className="text-white">Audio (.mp3, .wav, .m4a):</strong> Audio indicator card with formatted response instructions.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* 5. Connection & n8n Tab */}
          {activeTab === 'connection' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span
                  style={{ color: palette.colors.textMuted }}
                  className="text-xs font-bold uppercase tracking-wider"
                >
                  Live Webhook Integration
                </span>
                <button
                  onClick={() => {
                    if (settings.soundEffects) sound.click();
                    loadStatus();
                  }}
                  disabled={isCheckingServer}
                  style={{ color: palette.colors.primary }}
                  className="flex items-center gap-1.5 text-xs font-bold hover:underline"
                >
                  <RefreshCw size={12} className={isCheckingServer ? 'animate-spin' : ''} />
                  <span>Test Endpoint</span>
                </button>
              </div>

              <div
                style={{
                  backgroundColor: palette.colors.surfaceHover,
                  borderColor: palette.colors.border,
                }}
                className="p-4 rounded-2xl border space-y-3"
              >
                <div className="flex items-center justify-between text-xs">
                  <span style={{ color: palette.colors.textMuted }}>Endpoint:</span>
                  <span style={{ color: palette.colors.primary }} className="font-mono font-bold">
                    {serverInfo?.webhookUrl || 'https://raphadi.app.n8n.cloud/webhook/nexus-ai'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span style={{ color: palette.colors.textMuted }}>Workflow Status:</span>
                  <span
                    style={{ color: isWebhookReachable ? palette.colors.accent : '#ef4444' }}
                    className="inline-flex items-center gap-1.5 font-bold"
                  >
                    <span
                      style={{ backgroundColor: isWebhookReachable ? palette.colors.accent : '#ef4444' }}
                      className="w-2 h-2 rounded-full animate-pulse"
                    />
                    {isCheckingServer
                      ? 'Checking...'
                      : isWebhookReachable
                        ? 'Webhook reachable'
                        : serverInfo?.webhookStatus
                          ? `Unavailable (${serverInfo.webhookStatus})`
                          : 'Status unavailable'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span style={{ color: palette.colors.textMuted }}>Timeout:</span>
                  <span className="font-mono font-bold">60 seconds</span>
                </div>
              </div>
            </div>
          )}

          {/* 6. About Tab */}
          {activeTab === 'about' && (
            <div className="space-y-4 text-center py-4">
              <div
                style={{
                  backgroundColor: palette.colors.primarySubtle,
                  borderColor: palette.colors.borderHighlight,
                  color: palette.colors.primary,
                }}
                className="w-16 h-16 rounded-3xl border flex items-center justify-center text-3xl font-bold mx-auto mb-2 shadow-lg"
              >
                ✦
              </div>

              <div>
                <h3 className="text-xl font-bold font-heading">NEXUS AI</h3>
                <p style={{ color: palette.colors.primary }} className="text-xs font-semibold mt-0.5">
                  Your Intelligent AI Workspace
                </p>
              </div>

              <p
                style={{ color: palette.colors.textMuted }}
                className="text-xs max-w-md mx-auto leading-relaxed"
              >
                Engineered for maximum cognitive throughput. Supports conversational workflows,
                programming, document parsing, statistical data work, and custom modal personas.
              </p>

              <div
                style={{ borderColor: palette.colors.border }}
                className="text-[11px] font-mono opacity-60 pt-3 border-t"
              >
                Version 2.2.0 · Pro Edition · Built for Bolt.new
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{ borderColor: palette.colors.border }}
          className="px-6 py-3.5 border-t flex justify-end"
        >
          <button
            onClick={() => {
              if (settings.soundEffects) sound.click();
              onClose();
            }}
            style={{
              background: palette.colors.ring,
              color: '#FFFFFF',
              boxShadow: `0 4px 18px ${palette.colors.glow}`,
            }}
            className="px-5 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
