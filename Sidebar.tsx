import React, { useState } from 'react';
import {
  Plus,
  Search,
  Pin,
  Trash2,
  Download,
  Sun,
  Moon,
  Settings,
  X,
  MessageSquare,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Sliders,
  AlertTriangle,
  FileText,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Conversation, ReplyMode, AppSettings, ThemePalette } from '../types';
import { formatRelativeDate } from '../utils/markdown';
import { PALETTES, getPalette } from '../utils/themePalettes';
import { sound } from '../utils/soundEffects';

interface SidebarProps {
  conversations: Conversation[];
  activeId: string;
  pinnedIds: string[];
  currentMode: ReplyMode;
  settings: AppSettings;
  isOpen: boolean;
  searchQuery: string;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onDeleteAllConversations: () => void;
  onTogglePin: (id: string) => void;
  onModeChange: (mode: ReplyMode) => void;
  onPaletteChange: (palette: ThemePalette) => void;
  onExportChat: () => void;
  onToggleTheme: () => void;
  onFontSizeChange: (size: number) => void;
  onOpenSettings: () => void;
  onOpenSearch: () => void;
  onCloseMobile: () => void;
  onToggleCollapse: () => void;
  isCollapsed: boolean;
}

const MODES: { id: ReplyMode; label: string; desc: string; icon: string }[] = [
  { id: 'General', label: 'General', desc: 'Versatile AI workspace assistant', icon: '✦' },
  { id: 'Coder', label: 'Coder', desc: 'Expert programmer with clean, production code', icon: '⚡' },
  { id: 'Writer', label: 'Writer', desc: 'Professional writer for tone, clarity & structure', icon: '✍️' },
  { id: 'Translator', label: 'Translator', desc: 'Accurate multi-language translation', icon: '🌐' },
  { id: 'Roman Urdu', label: 'Roman Urdu', desc: 'Replies in Roman Urdu English script', icon: '🗣️' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeId,
  pinnedIds,
  currentMode,
  settings,
  isOpen,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onDeleteAllConversations,
  onTogglePin,
  onModeChange,
  onPaletteChange,
  onExportChat,
  onToggleTheme,
  onFontSizeChange,
  onOpenSettings,
  onOpenSearch,
  onCloseMobile,
  onToggleCollapse,
  isCollapsed,
}) => {
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [sidebarFilter, setSidebarFilter] = useState('');

  const palette = getPalette(settings.palette);

  // Sort pinned first, then newest
  const sortedConversations = [...conversations].sort((a, b) => {
    const aPinned = pinnedIds.includes(a.id);
    const bPinned = pinnedIds.includes(b.id);
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    return (b.updated_at || 0) - (a.updated_at || 0);
  });

  const filteredConversations = sidebarFilter.trim()
    ? sortedConversations.filter((c) =>
        c.title.toLowerCase().includes(sidebarFilter.toLowerCase())
      )
    : sortedConversations;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-md lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        style={{
          backgroundColor: palette.colors.bgSubtle,
          borderColor: palette.colors.border,
          color: palette.colors.text,
        }}
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col transition-all duration-300 ease-in-out border-r shadow-2xl
          ${isCollapsed ? 'w-20' : 'w-72 sm:w-80'}
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Brand Header */}
        <div
          style={{ borderColor: palette.colors.border }}
          className="flex items-center justify-between px-4 py-4 border-b"
        >
          {!isCollapsed ? (
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span
                  style={{ color: palette.colors.primary }}
                  className="font-bold text-xl drop-shadow"
                >
                  ✦
                </span>
                <span
                  style={{
                    background: palette.colors.ring,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                  className="font-extrabold text-lg tracking-wider"
                >
                  NEXUS AI
                </span>
                <span
                  style={{
                    backgroundColor: palette.colors.primarySubtle,
                    color: palette.colors.primary,
                    borderColor: palette.colors.borderHighlight,
                  }}
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded border font-semibold ml-1"
                >
                  PRO
                </span>
              </div>
              <span
                style={{ color: palette.colors.textMuted }}
                className="text-[11px] font-medium tracking-wide mt-0.5"
              >
                Your Intelligent AI Workspace
              </span>
            </div>
          ) : (
            <div
              style={{
                backgroundColor: palette.colors.primarySubtle,
                color: palette.colors.primary,
              }}
              className="mx-auto flex items-center justify-center w-10 h-10 rounded-xl font-bold text-lg"
            >
              ✦
            </div>
          )}

          <div className="flex items-center gap-1">
            {/* Collapse toggle (desktop) */}
            <button
              onClick={() => {
                if (settings.soundEffects) sound.click();
                onToggleCollapse();
              }}
              className="hidden lg:flex p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>

            {/* Mobile close */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Primary Action: New Conversation */}
        <div className="p-3">
          <button
            onClick={() => {
              if (settings.soundEffects) sound.click();
              onNewConversation();
              onCloseMobile();
            }}
            style={{
              background: palette.colors.ring,
              color: '#FFFFFF',
              boxShadow: `0 4px 18px ${palette.colors.glow}`,
            }}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 font-semibold text-sm transition-all hover:brightness-110 active:scale-[0.98]"
          >
            <Plus size={18} strokeWidth={2.5} />
            {!isCollapsed && <span>New Conversation</span>}
          </button>
        </div>

        {/* Mode Selector & Quick Search */}
        {!isCollapsed && (
          <div className="px-3 pb-2 space-y-2.5">
            {/* Mode selection dropdown */}
            <div className="flex flex-col gap-1">
              <label
                style={{ color: palette.colors.textMuted }}
                className="text-[11px] font-bold uppercase tracking-wider px-1"
              >
                Reply Mode
              </label>
              <div className="relative">
                <select
                  value={currentMode}
                  onChange={(e) => {
                    if (settings.soundEffects) sound.click();
                    onModeChange(e.target.value as ReplyMode);
                  }}
                  style={{
                    backgroundColor: palette.colors.surface,
                    borderColor: palette.colors.border,
                    color: palette.colors.text,
                  }}
                  className="w-full rounded-xl px-3 py-2 text-xs font-semibold appearance-none cursor-pointer border transition-all hover:border-cyan-400 focus:outline-none"
                >
                  {MODES.map((m) => (
                    <option
                      key={m.id}
                      value={m.id}
                      style={{
                        backgroundColor: palette.colors.surface,
                        color: palette.colors.text,
                      }}
                    >
                      {m.icon} {m.label} Mode
                    </option>
                  ))}
                </select>
                <div
                  style={{ color: palette.colors.primary }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-xs font-bold"
                >
                  ▼
                </div>
              </div>
            </div>

            {/* Quick Palette Switcher Strip */}
            <div className="flex flex-col gap-1">
              <label
                style={{ color: palette.colors.textMuted }}
                className="text-[11px] font-bold uppercase tracking-wider px-1 flex items-center justify-between"
              >
                <span>Theme Palette</span>
                <span
                  style={{ color: palette.colors.primary }}
                  className="text-[10px] font-semibold"
                >
                  {palette.name.split(' ')[0]}
                </span>
              </label>
              <div className="grid grid-cols-5 gap-1.5 p-1 rounded-xl bg-black/20 border border-white/5">
                {(Object.keys(PALETTES) as ThemePalette[]).map((palKey) => {
                  const pal = PALETTES[palKey];
                  const isSelected = settings.palette === palKey;
                  return (
                    <button
                      key={palKey}
                      onClick={() => {
                        if (settings.soundEffects) sound.click();
                        onPaletteChange(palKey);
                      }}
                      style={{
                        backgroundColor: pal.colors.surface,
                        borderColor: isSelected ? pal.colors.primary : 'transparent',
                        boxShadow: isSelected ? `0 0 10px ${pal.colors.glow}` : 'none',
                      }}
                      className={`h-7 rounded-lg border-2 flex items-center justify-center transition-all hover:scale-105 ${
                        isSelected ? 'scale-105' : 'opacity-70 hover:opacity-100'
                      }`}
                      title={pal.name}
                    >
                      <span
                        style={{ backgroundColor: pal.colors.primary }}
                        className="w-3 h-3 rounded-full"
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* In-sidebar chat search input */}
            <div className="relative">
              <Search
                size={14}
                style={{ color: palette.colors.textMuted }}
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search saved chats..."
                value={sidebarFilter}
                onChange={(e) => setSidebarFilter(e.target.value)}
                style={{
                  backgroundColor: palette.colors.surface,
                  borderColor: palette.colors.border,
                  color: palette.colors.text,
                }}
                className="w-full pl-9 pr-7 py-1.5 text-xs rounded-xl border transition-all focus:outline-none focus:border-cyan-400"
              />
              {sidebarFilter && (
                <button
                  onClick={() => setSidebarFilter('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        )}

        {/* Saved Conversations List */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1 scrollbar-thin">
          {!isCollapsed && (
            <div className="flex items-center justify-between px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Conversations</span>
              <span
                style={{ color: palette.colors.primary }}
                className="text-[10px] font-mono tabular-nums px-1.5 py-0.5 rounded bg-white/5"
              >
                {filteredConversations.length}
              </span>
            </div>
          )}

          {filteredConversations.length === 0 ? (
            <div
              style={{ color: palette.colors.textMuted }}
              className="px-3 py-8 text-center text-xs"
            >
              {sidebarFilter ? 'No matching conversations' : 'No saved conversations yet'}
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isActive = conv.id === activeId;
              const isPinned = pinnedIds.includes(conv.id);

              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    if (settings.soundEffects) sound.click();
                    onSelectConversation(conv.id);
                    onCloseMobile();
                  }}
                  style={{
                    backgroundColor: isActive ? palette.colors.surfaceActive : 'transparent',
                    borderColor: isActive ? palette.colors.borderHighlight : 'transparent',
                    boxShadow: isActive ? `0 2px 10px ${palette.colors.glow}` : 'none',
                  }}
                  className={`group relative flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs cursor-pointer transition-all border
                    ${!isActive ? 'hover:bg-white/5' : 'font-semibold'}
                  `}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="shrink-0">
                      {isPinned ? (
                        <Pin size={13} className="text-amber-400 fill-amber-400" />
                      ) : (
                        <MessageSquare
                          size={13}
                          style={{
                            color: isActive ? palette.colors.primary : palette.colors.textMuted,
                          }}
                        />
                      )}
                    </span>
                    {!isCollapsed && (
                      <div className="flex flex-col min-w-0">
                        <span
                          style={{
                            color: isActive ? palette.colors.text : palette.colors.textMuted,
                          }}
                          className="truncate text-xs group-hover:text-white transition-colors"
                        >
                          {conv.title || 'Untitled Conversation'}
                        </span>
                        <span className="text-[10px] opacity-60 tabular-nums font-mono">
                          {formatRelativeDate(conv.updated_at)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions visible on hover or active */}
                  {!isCollapsed && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (settings.soundEffects) sound.click();
                          onTogglePin(conv.id);
                        }}
                        className={`p-1 rounded hover:bg-white/10 ${
                          isPinned ? 'text-amber-400' : 'text-slate-400 hover:text-white'
                        }`}
                        title={isPinned ? 'Unpin' : 'Pin to top'}
                      >
                        <Pin size={12} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (settings.soundEffects) sound.click();
                          onDeleteConversation(conv.id);
                        }}
                        className="p-1 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400"
                        title="Delete chat"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Workspace Controls & Settings Footer */}
        <div
          style={{ borderColor: palette.colors.border }}
          className="p-3 border-t space-y-2.5"
        >
          {!isCollapsed && (
            <>
              {/* Quick Tools Row: Export & Search Modal */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    if (settings.soundEffects) sound.click();
                    onExportChat();
                  }}
                  style={{
                    backgroundColor: palette.colors.surface,
                    borderColor: palette.colors.border,
                  }}
                  className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all hover:brightness-110"
                  title="Export active chat as Markdown"
                >
                  <Download size={13} style={{ color: palette.colors.primary }} />
                  <span>Export</span>
                </button>

                <button
                  onClick={() => {
                    if (settings.soundEffects) sound.click();
                    onOpenSearch();
                  }}
                  style={{
                    backgroundColor: palette.colors.surface,
                    borderColor: palette.colors.border,
                  }}
                  className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all hover:brightness-110"
                  title="Search messages (Cmd+K)"
                >
                  <Search size={13} style={{ color: palette.colors.primary }} />
                  <span>Search</span>
                </button>
              </div>

              {/* Font Size Adjuster slider */}
              <div className="flex items-center justify-between gap-2 px-1 text-[11px] text-slate-400">
                <span>Text Size</span>
                <input
                  type="range"
                  min="12"
                  max="20"
                  value={settings.fontSize}
                  onChange={(e) => onFontSizeChange(parseInt(e.target.value, 10))}
                  style={{ accentColor: palette.colors.primary }}
                  className="w-24 h-1 rounded-lg cursor-pointer"
                />
                <span
                  style={{ color: palette.colors.primary }}
                  className="tabular-nums font-mono text-[10px] w-5 text-right font-bold"
                >
                  {settings.fontSize}px
                </span>
              </div>

              {/* Delete all conversations button with safety dialog */}
              {!showDeleteAllConfirm ? (
                <button
                  onClick={() => setShowDeleteAllConfirm(true)}
                  className="w-full flex items-center justify-center gap-1.5 py-1 px-2 text-xs text-slate-400 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={12} />
                  <span>Clear All Conversations</span>
                </button>
              ) : (
                <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-500/30 text-xs space-y-2">
                  <div className="flex items-center gap-1.5 text-red-300 font-semibold">
                    <AlertTriangle size={13} />
                    <span>Delete all chats forever?</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        onDeleteAllConversations();
                        setShowDeleteAllConfirm(false);
                      }}
                      className="flex-1 py-1 px-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold"
                    >
                      Yes, Clear All
                    </button>
                    <button
                      onClick={() => setShowDeleteAllConfirm(false)}
                      className="flex-1 py-1 px-2 bg-white/10 hover:bg-white/20 text-slate-200 rounded-lg text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Settings Trigger & App Signature */}
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={() => {
                if (settings.soundEffects) sound.click();
                onOpenSettings();
              }}
              style={{
                backgroundColor: palette.colors.surface,
                borderColor: palette.colors.border,
              }}
              className="flex items-center gap-2 py-1.5 px-3 rounded-xl text-xs font-semibold border transition-all hover:brightness-110"
              title="Workspace Settings"
            >
              <Settings size={15} style={{ color: palette.colors.primary }} />
              {!isCollapsed && <span>Settings</span>}
            </button>

            {!isCollapsed && (
              <span
                style={{ color: palette.colors.accent }}
                className="text-[10px] font-mono flex items-center gap-1.5"
              >
                <span
                  style={{ backgroundColor: palette.colors.accent }}
                  className="w-2 h-2 rounded-full inline-block animate-pulse"
                />
                n8n Online
              </span>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
