import React, { useState, useEffect, useRef } from 'react';
import { Search, X, MessageSquare, ArrowRight, CornerDownLeft, Filter } from 'lucide-react';
import { Conversation, AppSettings } from '../types';
import { formatRelativeDate } from '../utils/markdown';
import { getPalette } from '../utils/themePalettes';
import { sound } from '../utils/soundEffects';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: Conversation[];
  onSelectConversation: (id: string) => void;
  settings: AppSettings;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  conversations,
  onSelectConversation,
  settings,
}) => {
  const [query, setQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'user' | 'assistant'>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  const palette = getPalette(settings.palette);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setFilterRole('all');
    }
  }, [isOpen]);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const trimmed = query.trim().toLowerCase();

  // Search through all conversations and messages with role filtering
  const results: { conversation: Conversation; snippet?: string; matchRole?: string }[] = [];

  if (trimmed) {
    for (const conv of conversations) {
      const titleMatch = conv.title.toLowerCase().includes(trimmed);
      let matchedSnippet: string | undefined;
      let matchRole: string | undefined;

      for (const msg of conv.messages) {
        if (filterRole !== 'all' && msg.role !== filterRole) {
          continue;
        }

        const text = msg.content || '';
        const idx = text.toLowerCase().indexOf(trimmed);
        if (idx !== -1) {
          const start = Math.max(0, idx - 45);
          const end = Math.min(text.length, idx + 95);
          matchedSnippet = (start > 0 ? '...' : '') + text.slice(start, end) + (end < text.length ? '...' : '');
          matchRole = msg.role;
          break;
        }
      }

      if (titleMatch || matchedSnippet) {
        results.push({ conversation: conv, snippet: matchedSnippet, matchRole });
      }
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-20 px-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: palette.colors.surface,
          borderColor: palette.colors.borderHighlight,
          boxShadow: `0 25px 80px rgba(0,0,0,0.7), 0 0 50px ${palette.colors.glow}`,
          color: palette.colors.text,
        }}
        className="w-full max-w-2xl rounded-3xl border overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div
          style={{ borderColor: palette.colors.border }}
          className="flex items-center px-5 py-3.5 border-b gap-3"
        >
          <Search size={18} style={{ color: palette.colors.primary }} className="shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search conversation titles, code, or messages..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ color: palette.colors.text }}
            className="w-full bg-transparent border-none text-sm font-medium focus:outline-none placeholder-slate-400"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded text-slate-400 hover:text-white"
            >
              <X size={15} />
            </button>
          )}
          <kbd
            style={{
              backgroundColor: palette.colors.surfaceHover,
              borderColor: palette.colors.border,
            }}
            className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-slate-400 border rounded-md"
          >
            ESC
          </kbd>
        </div>

        {/* Filter Pills */}
        <div
          style={{ borderColor: palette.colors.border }}
          className="flex items-center gap-2 px-5 py-2 border-b text-xs font-semibold"
        >
          <span style={{ color: palette.colors.textMuted }} className="text-[11px] uppercase mr-1">
            Filter:
          </span>
          {(['all', 'user', 'assistant'] as const).map((role) => (
            <button
              key={role}
              onClick={() => {
                if (settings.soundEffects) sound.click();
                setFilterRole(role);
              }}
              style={{
                backgroundColor: filterRole === role ? palette.colors.primary : palette.colors.surfaceHover,
                color: filterRole === role ? '#FFFFFF' : palette.colors.textMuted,
              }}
              className="px-2.5 py-0.5 rounded-lg text-xs capitalize transition-all"
            >
              {role === 'all' ? 'All Messages' : role === 'user' ? 'My Prompts' : 'AI Replies'}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-1.5 scrollbar-thin">
          {!trimmed ? (
            <div
              style={{ color: palette.colors.textMuted }}
              className="p-10 text-center text-xs"
            >
              Type keywords above to instantly scan through all saved conversations...
            </div>
          ) : results.length === 0 ? (
            <div
              style={{ color: palette.colors.textMuted }}
              className="p-10 text-center text-xs"
            >
              No matching conversations or messages found for "{query}".
            </div>
          ) : (
            results.map(({ conversation, snippet, matchRole }) => (
              <div
                key={conversation.id}
                onClick={() => {
                  if (settings.soundEffects) sound.click();
                  onSelectConversation(conversation.id);
                  onClose();
                }}
                style={{
                  backgroundColor: palette.colors.surfaceHover,
                  borderColor: palette.colors.border,
                }}
                className="p-3.5 rounded-2xl border hover:border-cyan-400 cursor-pointer transition-all flex items-start justify-between gap-3 group"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    style={{
                      backgroundColor: palette.colors.primarySubtle,
                      color: palette.colors.primary,
                    }}
                    className="p-2 rounded-xl mt-0.5 shrink-0"
                  >
                    <MessageSquare size={16} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="font-bold text-xs truncate group-hover:text-cyan-300 transition-colors">
                      {conversation.title}
                    </div>
                    {snippet && (
                      <div
                        style={{ color: palette.colors.textMuted }}
                        className="text-[11px] mt-1 line-clamp-2 leading-relaxed font-sans"
                      >
                        <span
                          style={{ color: palette.colors.primary }}
                          className="font-bold uppercase text-[9px] mr-1.5"
                        >
                          [{matchRole || 'match'}]
                        </span>
                        {snippet}
                      </div>
                    )}
                    <span className="text-[10px] opacity-60 mt-1.5 tabular-nums font-mono">
                      {formatRelativeDate(conversation.updated_at)} · {conversation.messages.length} messages
                    </span>
                  </div>
                </div>

                <ArrowRight
                  size={15}
                  style={{ color: palette.colors.primary }}
                  className="opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all mt-1.5 shrink-0"
                />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
