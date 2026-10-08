import React, { useState } from 'react';
import {
  Menu,
  Pin,
  Download,
  Settings,
  Edit2,
  Check,
  Palette,
  Search,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { ReplyMode, ThemePalette, AppSettings } from '../types';
import { getPalette } from '../utils/themePalettes';
import { sound } from '../utils/soundEffects';

interface HeaderProps {
  title: string;
  totalMessages: number;
  userMessages: number;
  assistantMessages: number;
  isPinned: boolean;
  currentMode: ReplyMode;
  settings: AppSettings;
  onOpenMobileSidebar: () => void;
  onTogglePin: () => void;
  onExportChat: () => void;
  onOpenSettings: () => void;
  onOpenSearch: () => void;
  onUpdateTitle: (newTitle: string) => void;
  onPaletteChange: (pal: ThemePalette) => void;
  onToggleSound: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  totalMessages,
  userMessages,
  assistantMessages,
  isPinned,
  currentMode,
  settings,
  onOpenMobileSidebar,
  onTogglePin,
  onExportChat,
  onOpenSettings,
  onOpenSearch,
  onUpdateTitle,
  onPaletteChange,
  onToggleSound,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);

  const palette = getPalette(settings.palette);

  const handleSaveTitle = () => {
    if (tempTitle.trim()) {
      onUpdateTitle(tempTitle.trim());
    }
    setIsEditing(false);
  };

  return (
    <header
      style={{
        backgroundColor: `${palette.colors.bgSubtle}E6`,
        borderColor: palette.colors.border,
        color: palette.colors.text,
      }}
      className="sticky top-0 z-30 flex flex-col border-b backdrop-blur-xl transition-colors shadow-sm"
    >
      {/* Top Navbar Row */}
      <div className="flex items-center justify-between px-4 py-2.5 gap-3">
        {/* Left: Mobile trigger & Conversation Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => {
              if (settings.soundEffects) sound.click();
              onOpenMobileSidebar();
            }}
            className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
            title="Open menu"
          >
            <Menu size={18} />
          </button>

          {/* Editable Title */}
          <div className="flex items-center gap-2 min-w-0">
            {isEditing ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveTitle();
                    if (e.key === 'Escape') setIsEditing(false);
                  }}
                  autoFocus
                  style={{
                    backgroundColor: palette.colors.surface,
                    borderColor: palette.colors.primary,
                    color: palette.colors.text,
                  }}
                  className="px-2.5 py-1 text-sm font-semibold rounded-lg border focus:outline-none shadow-sm"
                />
                <button
                  onClick={handleSaveTitle}
                  style={{ color: palette.colors.primary }}
                  className="p-1 hover:brightness-125"
                >
                  <Check size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group min-w-0">
                <h1
                  onDoubleClick={() => {
                    setTempTitle(title);
                    setIsEditing(true);
                  }}
                  className="text-sm font-bold truncate cursor-pointer hover:underline decoration-cyan-400 decoration-2 transition-all"
                  title="Double-click to rename"
                >
                  {title || 'New Conversation'}
                </h1>
                <button
                  onClick={() => {
                    setTempTitle(title);
                    setIsEditing(true);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-white transition-opacity"
                  title="Rename conversation"
                >
                  <Edit2 size={12} />
                </button>
              </div>
            )}

            {/* Mode badge */}
            <span
              style={{
                backgroundColor: palette.colors.primarySubtle,
                borderColor: palette.colors.borderHighlight,
                color: palette.colors.primary,
              }}
              className="hidden sm:inline-flex items-center px-2.5 py-0.5 text-[11px] font-semibold rounded-full border shadow-sm"
            >
              {currentMode} Mode
            </span>
          </div>
        </div>

        {/* Right Action buttons */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Quick Search Trigger */}
          <button
            onClick={() => {
              if (settings.soundEffects) sound.click();
              onOpenSearch();
            }}
            style={{
              backgroundColor: palette.colors.surface,
              borderColor: palette.colors.border,
            }}
            className="p-1.5 sm:px-2.5 sm:py-1 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all hover:brightness-110"
            title="Search history (Cmd+K)"
          >
            <Search size={13} style={{ color: palette.colors.primary }} />
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden md:inline px-1 py-0.2 rounded bg-white/10 text-[9px] font-mono">⌘K</kbd>
          </button>

          {/* Sound FX Toggle Button */}
          <button
            onClick={onToggleSound}
            style={{
              backgroundColor: palette.colors.surface,
              borderColor: palette.colors.border,
            }}
            className="p-1.5 rounded-xl text-xs font-semibold border flex items-center justify-center transition-all hover:brightness-110"
            title={settings.soundEffects ? 'Sound FX: On' : 'Sound FX: Muted'}
          >
            {settings.soundEffects ? (
              <Volume2 size={14} style={{ color: palette.colors.accent }} />
            ) : (
              <VolumeX size={14} className="text-slate-500" />
            )}
          </button>

          {/* Pin Button */}
          <button
            onClick={() => {
              if (settings.soundEffects) sound.click();
              onTogglePin();
            }}
            style={{
              backgroundColor: isPinned ? 'rgba(245, 158, 11, 0.15)' : palette.colors.surface,
              borderColor: isPinned ? 'rgba(245, 158, 11, 0.5)' : palette.colors.border,
              color: isPinned ? '#FBBF24' : palette.colors.text,
            }}
            className="p-1.5 sm:px-2.5 sm:py-1 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all hover:brightness-110"
            title={isPinned ? 'Unpin chat' : 'Pin chat to top'}
          >
            <Pin size={13} className={isPinned ? 'fill-amber-400' : ''} />
            <span className="hidden sm:inline">{isPinned ? 'Pinned' : 'Pin'}</span>
          </button>

          {/* Export Chat */}
          <button
            onClick={() => {
              if (settings.soundEffects) sound.click();
              onExportChat();
            }}
            style={{
              backgroundColor: palette.colors.surface,
              borderColor: palette.colors.border,
            }}
            className="p-1.5 sm:px-2.5 sm:py-1 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all hover:brightness-110"
            title="Export as Markdown"
          >
            <Download size={13} style={{ color: palette.colors.primary }} />
            <span className="hidden sm:inline">Export</span>
          </button>

          {/* Settings Modal */}
          <button
            onClick={() => {
              if (settings.soundEffects) sound.click();
              onOpenSettings();
            }}
            style={{
              backgroundColor: palette.colors.surface,
              borderColor: palette.colors.border,
            }}
            className="p-1.5 rounded-xl border transition-all hover:brightness-110"
            title="Settings"
          >
            <Settings size={15} style={{ color: palette.colors.primary }} />
          </button>
        </div>
      </div>

      {/* Workspace Dashboard Stats Bar (preserving Python app.py metrics) */}
      <div
        style={{
          backgroundColor: `${palette.colors.surface}80`,
          borderColor: palette.colors.border,
        }}
        className="hidden md:grid grid-cols-4 gap-2 px-4 py-2 border-t text-xs font-medium"
      >
        <div className="flex items-center gap-2">
          <span style={{ color: palette.colors.primary }}>✦</span>
          <span style={{ color: palette.colors.textMuted }} className="text-[11px]">Workspace:</span>
          <span
            style={{ color: palette.colors.accent }}
            className="font-bold text-[11px] tracking-wide flex items-center gap-1"
          >
            <span
              style={{ backgroundColor: palette.colors.accent }}
              className="w-1.5 h-1.5 rounded-full inline-block animate-pulse"
            />
            ONLINE
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span style={{ color: palette.colors.primary }}>💬</span>
          <span style={{ color: palette.colors.textMuted }} className="text-[11px]">Total Messages:</span>
          <span
            style={{ color: palette.colors.text }}
            className="font-mono tabular-nums font-bold"
          >
            {totalMessages}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span style={{ color: palette.colors.primary }}>👤</span>
          <span style={{ color: palette.colors.textMuted }} className="text-[11px]">User Prompts:</span>
          <span
            style={{ color: palette.colors.text }}
            className="font-mono tabular-nums font-bold"
          >
            {userMessages}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span style={{ color: palette.colors.primary }}>🤖</span>
          <span style={{ color: palette.colors.textMuted }} className="text-[11px]">AI Responses:</span>
          <span
            style={{ color: palette.colors.text }}
            className="font-mono tabular-nums font-bold"
          >
            {assistantMessages}
          </span>
        </div>
      </div>
    </header>
  );
};
