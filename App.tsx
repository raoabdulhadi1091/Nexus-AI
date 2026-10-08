import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { WelcomeScreen } from './components/WelcomeScreen';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput, SendMessageExtras } from './components/ChatInput';
import { SettingsModal } from './components/SettingsModal';
import { SearchModal } from './components/SearchModal';
import {
  Conversation,
  ChatMessage as ChatMessageType,
  ReplyMode,
  AppSettings,
  AttachedFile,
} from './types';
import {
  fetchConversations,
  saveConversation,
  deleteConversation as apiDeleteConversation,
  deleteAllConversations as apiDeleteAllConversations,
  fetchPinned,
  savePinned,
  sendChatMessage,
  transcribeVoiceNote,
  exportChatToMarkdown,
} from './utils/api';
import { getPalette } from './utils/themePalettes';
import { sound } from './utils/soundEffects';

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  palette: 'cyber-cyan',
  fontSize: 15,
  density: 'comfortable',
  enterToSend: true,
  defaultMode: 'General',
  ttsVoice: '',
  ttsRate: 1.0,
  ttsPitch: 1.0,
  soundEffects: true,
  streamEffect: true,
};

function createNewSessionId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'conv-' + Math.random().toString(36).substring(2, 11) + '-' + Date.now();
}

function isLikelyImageGenPrompt(prompt: string, hasReferenceImage: boolean): boolean {
  const p = (prompt || '').trim().toLowerCase();
  if (!p) return false;

  if (
    /^(generate|create|draw|make|made|design|paint|render|sketch|illustrate|produce)\s+(an?\s+|another\s+|the\s+|me\s+an?\s+|good\s+quality\s+)?(new\s+|ultra\s+hd\s+|high\s+quality\s+|good\s+quality\s+|photorealistic\s+|futuristic\s+|realistic\s+|dark\s+|modern\s+|digital\s+|3d\s+|cinematic\s+|professional\s+)?(image|picture|photo|photograph|portrait|landscape|illustration|artwork|diagram|logo|icon|wallpaper|poster|banner|mockup|visual|graphic|version|render|scene|laboratory|office)\b/i.test(
      p
    )
  ) {
    return true;
  }

  if (
    /\b(tasveer|taswir|image|photo|picture|pic|wallpaper|logo|portrait)\s+(banao|bana\s+do|bna\s+do|bnado|banado|bna\s+kr\s+do+|bana\s+kar\s+do+|bna\s+de|bana\s+de|banaye|bna|bana|generate\s+karo|generate\s+kro|create\s+karo|create\s+kro)\b/i.test(
      p
    ) ||
    /\b(banao|bana\s+do|bna\s+do|bna\s+kr\s+do+|bana\s+kar\s+do+)\b.*\b(tasveer|taswir|image|photo|picture|pic)\b/i.test(
      p
    )
  ) {
    return true;
  }

  if (
    /^(generate|create|draw|paint|render|illustrate)\s+(a|an)\s+(realistic|photorealistic|ultra-realistic|hyper-realistic|futuristic|cyberpunk|neon|dark|minimalist|3d|cinematic|high-tech|abstract|surreal|modern|professional|sleek|vibrant|colorful|detailed|luxury|commercial)\b/i.test(
      p
    ) &&
    !/\b(code|function|script|essay|email|article|summary|list|table|explanation|report|proposal|query|sql|python|javascript|react|component)\b/i.test(
      p
    )
  ) {
    return true;
  }

  if (hasReferenceImage) {
    if (/^(what|who|where|when|why|how\s+many|describe|explain|read|transcribe|tell\s+me\s+about|is\s+there|are\s+there|can\s+you\s+(see|read|explain|describe)|ye\s+kya\s+hai|is\s+mein\s+kya\s+hai|batao\s+ye\s+kya\s+hai)\b/i.test(p)) {
      return false;
    }
    if (
      /\b(quality\s+(improve|achi|acha|behtar|badhao|enhance|increase|upgrade|high|hd|ultra|best|shi|sahi))\b/i.test(p) ||
      /\b(improve|enhance|upgrade|upscale|sharpen|unblur|restore|fix|clear|saaf|hd|4k|8k|ultra\s*hd)\s+(its?\s+|the\s+|this\s+|my\s+|iski\s+|is\s+|ye\s+)?(quality|image|photo|pic|picture|tasveer|taswir|resolution|clarity|face|skin|lighting|pixels)?\b/i.test(
        p
      ) ||
      /\b(iski|is\s+ki|is\s+image\s+ki|is\s+pic\s+ki|is\s+photo\s+ki|meri\s+pic\s+ki|meri\s+image\s+ki)\s+(quality|clarity|resolution|result)\b/i.test(
        p
      ) ||
      /\b(isko|is\s+ko|is\s+pic\s+ko|is\s+image\s+ko|is\s+photo\s+ko)\s+(hd|4k|8k|ultra\s*hd|clear|saaf|sharp|behtar|improve|enhance)\s*(kr|kar|kro|karo|krdo|kar\s+do|kr\s+do|bna|bana)?\b/i.test(
        p
      ) ||
      /\b(iss?\s+j[aei]+s[iy]|is\s+tarah\s+ki|aisi\s+hi|waisi\s+hi|same\s+to\s+same|bilkul\s+aisi|is\s+photo\s+jaisi|is\s+image\s+jaisi|is\s+pic\s+jaisi)\b/i.test(
        p
      ) ||
      /\b(eik\s+aur|ek\s+aur|ik\s+aur|aur\s+image|aur\s+pic|aur\s+photo|aur\s+tasveer|dusri\s+image|doosri\s+pic|new\s+version)\b.*\b(bna|bana|bnado|bna\s+do|bana\s+do|bna\s+kr|bana\s+kar|generate|create|make|de\s+do|do|doo)\b/i.test(
        p
      ) ||
      /\b(iska|is\s+ka|iske|is\s+ke|iski|is\s+ki|isko|is\s+ko)\s+(background|bg|color|rang|kapray|kapre|dress|suit|outfit|style|lighting|look|scene|pose|hair|baal)\s*(change|badal|replace|edit|modify|set|bna|bana|kr|kar)/i.test(
        p
      ) ||
      /\b(make\s+(it|this|the\s+\w+)\s+(more\s+|less\s+|very\s+|super\s+|ultra\s+)?(realistic|photorealistic|darker|brighter|lighter|warmer|cooler|cinematic|professional|natural|detailed|sharp|vibrant|colorful|modern|futuristic|minimalist|dramatic))\b/i.test(
        p
      ) ||
      /\b(make\s+the\s+(lighting|background|person|face|skin|eyes|hands|colors|shadows|composition|car|building|room|scene|subject|environment|clothes|outfit)\b)/i.test(
        p
      ) ||
      /\b(change|replace|swap|modify|adjust|update|alter|switch)\s+(the\s+|its\s+|his\s+|her\s+)?(background|lighting|color|colours|clothes|clothing|outfit|environment|setting|style|weather|time\s+of\s+day|angle|perspective|camera|car\s+color|sky)\b/i.test(
        p
      ) ||
      /\b(keep\s+everything\s+(else\s+)?the\s+same\s+but|preserve\s+the\s+.*\s+but|same\s+composition\s+but)\b/i.test(
        p
      ) ||
      /\b(add|include|put|place)\s+(a|an|some|the|more)?\s*[a-z0-9\s]{2,40}\s*(in\s+the\s+background|in\s+the\s+foreground|to\s+it|to\s+this|to\s+the\s+image|to\s+the\s+scene|on\s+the\s+table|on\s+the\s+wall|in\s+the\s+sky)?$/i.test(
        p
      ) ||
      /\b(put\s+this\s+(person|subject|object|car|product)\s+in|turn\s+this\s+into|improve\s+this\s+image|enhance\s+this\s+image|create\s+a\s+similar\s+composition|use\s+this\s+image\s+as\s+reference|like\s+this\s+(image|photo|picture|one))\b/i.test(
        p
      ) ||
      /\b(create|make|generate|turn|transform|convert|redesign|restyle|modify|edit|regenerate)\s+(this|it|the\s+image|the\s+picture|a\s+.*version\s+of\s+this|another\s+version|another\s+one|another\s+image\s+like\s+this)\b/i.test(
        p
      )
    ) {
      return true;
    }
  }

  if (/\b(can\s+you\s+)?(make|create|generate|draw)\s+(another|a\s+different|a\s+new)\s+(version|image|one|variation)\b/i.test(p)) {
    return true;
  }

  return false;
}

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [currentMode, setCurrentMode] = useState<ReplyMode>('General');
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('nexus_ai_settings_v2');
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
      return DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState<string>('NEXUS AI is thinking...');
  const [externalAttachment, setExternalAttachment] = useState<AttachedFile | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery] = useState('');

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const composerInputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const palette = getPalette(settings.palette);

  // Initialize and load saved state
  useEffect(() => {
    async function init() {
      const [convList, pinned] = await Promise.all([
        fetchConversations(),
        fetchPinned(),
      ]);

      setConversations(convList);
      setPinnedIds(pinned);

      if (convList.length > 0) {
        setActiveId(convList[0].id);
      } else {
        const newId = createNewSessionId();
        const initialConv: Conversation = {
          id: newId,
          title: 'New Conversation',
          messages: [],
          updated_at: Date.now() / 1000,
        };
        setConversations([initialConv]);
        setActiveId(newId);
        saveConversation(initialConv);
      }
    }
    init();
  }, []);

  // Update CSS root variables and save settings
  useEffect(() => {
    localStorage.setItem('nexus_ai_settings_v2', JSON.stringify(settings));

    const root = document.documentElement;
    const colors = palette.colors;

    root.style.setProperty('--nexus-bg', colors.bg);
    root.style.setProperty('--nexus-bg-subtle', colors.bgSubtle);
    root.style.setProperty('--nexus-surface', colors.surface);
    root.style.setProperty('--nexus-surface-hover', colors.surfaceHover);
    root.style.setProperty('--nexus-surface-active', colors.surfaceActive);
    root.style.setProperty('--nexus-border', colors.border);
    root.style.setProperty('--nexus-border-highlight', colors.borderHighlight);
    root.style.setProperty('--nexus-text', colors.text);
    root.style.setProperty('--nexus-text-muted', colors.textMuted);
    root.style.setProperty('--nexus-primary', colors.primary);
    root.style.setProperty('--nexus-primary-hover', colors.primaryHover);
    root.style.setProperty('--nexus-primary-subtle', colors.primarySubtle);
    root.style.setProperty('--nexus-accent', colors.accent);
    root.style.setProperty('--nexus-glow', colors.glow);

    document.body.style.backgroundColor = colors.bg;
    document.body.style.color = colors.text;
  }, [settings, palette]);

  // Global keyboard shortcuts (Cmd/Ctrl+K for search, Cmd/Ctrl+Shift+O for new chat)
  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        handleNewConversation();
      }
    };
    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, [conversations]);

  // Auto-scroll chat to bottom on new messages
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [conversations, isGenerating, loadingStatus]);

  // Get active conversation object
  const activeConversation = conversations.find((c) => c.id === activeId) || {
    id: activeId || createNewSessionId(),
    title: 'New Conversation',
    messages: [],
    updated_at: Date.now() / 1000,
  };

  // Stats calculation
  const totalMessages = activeConversation.messages.length;
  const userMessages = activeConversation.messages.filter((m) => m.role === 'user').length;
  const assistantMessages = activeConversation.messages.filter((m) => m.role === 'assistant').length;
  const isPinned = pinnedIds.includes(activeConversation.id);

  // New Conversation Handler
  const handleNewConversation = () => {
    const newId = createNewSessionId();
    const newConv: Conversation = {
      id: newId,
      title: 'New Conversation',
      messages: [],
      updated_at: Date.now() / 1000,
    };

    setConversations((prev) => [newConv, ...prev]);
    setActiveId(newId);
    saveConversation(newConv);
    composerInputRef.current?.focus();
  };

  // Select existing conversation
  const handleSelectConversation = (id: string) => {
    setActiveId(id);
  };

  // Delete conversation
  const handleDeleteConversation = async (id: string) => {
    await apiDeleteConversation(id);
    const updated = conversations.filter((c) => c.id !== id);
    setConversations(updated);

    if (pinnedIds.includes(id)) {
      const newPinned = pinnedIds.filter((p) => p !== id);
      setPinnedIds(newPinned);
      savePinned(newPinned);
    }

    if (activeId === id) {
      if (updated.length > 0) {
        setActiveId(updated[0].id);
      } else {
        handleNewConversation();
      }
    }
  };

  // Delete all conversations
  const handleDeleteAllConversations = async () => {
    await apiDeleteAllConversations();
    setPinnedIds([]);
    handleNewConversation();
  };

  // Toggle Pin
  const handleTogglePin = async (id?: string) => {
    const targetId = id || activeConversation.id;
    let nextPinned: string[];
    if (pinnedIds.includes(targetId)) {
      nextPinned = pinnedIds.filter((p) => p !== targetId);
    } else {
      nextPinned = [...pinnedIds, targetId];
    }
    setPinnedIds(nextPinned);
    await savePinned(nextPinned);
  };

  // Update Title
  const handleUpdateTitle = (newTitle: string) => {
    const updatedConv: Conversation = {
      ...activeConversation,
      title: newTitle,
      updated_at: Date.now() / 1000,
    };
    setConversations((prev) => prev.map((c) => (c.id === updatedConv.id ? updatedConv : c)));
    saveConversation(updatedConv);
  };

  // Send Message (supports Text, Image, File, Voice Note, and all combinations)
  const handleSendMessage = async (
    text: string,
    file?: AttachedFile,
    extras?: SendMessageExtras
  ) => {
    const voiceNote = extras?.voiceNote;
    const secondaryFile = extras?.secondaryFile;
    const forceImageGen = extras?.forceImageGen;

    if ((!text.trim() && !file && !secondaryFile && !voiceNote) || isGenerating) return;

    const imageFile = file?.isImage ? file : secondaryFile?.isImage ? secondaryFile : undefined;
    const docFile =
      file && !file.isImage ? file : secondaryFile && !secondaryFile.isImage ? secondaryFile : undefined;

    const fileInfoParts: string[] = [];
    if (file) fileInfoParts.push(`${file.name} • ${(file.size / 1024).toFixed(1)} KB`);
    if (secondaryFile)
      fileInfoParts.push(`${secondaryFile.name} • ${(secondaryFile.size / 1024).toFixed(1)} KB`);

    const userMsgId = 'msg-' + Date.now();
    const initialContent =
      text.trim() ||
      (voiceNote
        ? '🎙️ Voice note'
        : imageFile
          ? '🖼️ Image attached'
          : '📎 File attached');

    const userMessage: ChatMessageType = {
      id: userMsgId,
      role: 'user',
      content: initialContent,
      ts: Date.now() / 1000,
      file_info: fileInfoParts.length > 0 ? fileInfoParts.join(' + ') : undefined,
      image_b64: imageFile?.content || imageFile?.base64,
      image_mime_type: imageFile?.mimeType || imageFile?.type,
      audio_b64: voiceNote?.base64,
      audio_mime_type: voiceNote?.mimeType,
      is_voice_note: Boolean(voiceNote),
      file,
      secondary_file: secondaryFile,
    };

    const previousHistory = [...activeConversation.messages];
    const hasHistoryImage = previousHistory.some(
      (m) => Boolean(m.image_b64 || m.generated_image_b64)
    );

    // Auto title generation on first message
    let newTitle = activeConversation.title;
    if (activeConversation.title === 'New Conversation' || !activeConversation.title) {
      if (text.trim()) {
        newTitle = text.trim().length > 45 ? text.trim().slice(0, 45) + '...' : text.trim();
      } else if (file) {
        newTitle = file.name;
      } else if (voiceNote) {
        newTitle = 'Voice Conversation';
      }
    }

    let updatedMessages = [...previousHistory, userMessage];
    let updatedConv: Conversation = {
      ...activeConversation,
      title: newTitle,
      messages: updatedMessages,
      updated_at: Date.now() / 1000,
    };

    setConversations((prev) =>
      prev.map((c) => (c.id === updatedConv.id ? updatedConv : c))
    );
    saveConversation(updatedConv);

    setIsGenerating(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      let effectiveText = text.trim();
      let resolvedVoiceNote = voiceNote;

      // Step 1: If a voice note was sent, transcribe it first with "Transcribing..." loading state
      if (voiceNote && voiceNote.base64) {
        setLoadingStatus('Transcribing...');
        const transRes = await transcribeVoiceNote(
          voiceNote.base64,
          voiceNote.mimeType,
          currentMode,
          controller.signal,
          voiceNote.clientTranscriptHint
        );

        if (transRes.status === 'error' || !transRes.transcript) {
          const errAssistantMsg: ChatMessageType = {
            id: 'msg-err-' + Date.now(),
            role: 'assistant',
            content:
              transRes.error || "I couldn't understand that voice message. Please try again.",
            ts: Date.now() / 1000,
            isError: true,
          };
          const finalMessages = [...updatedMessages, errAssistantMsg];
          const finalConv = { ...updatedConv, messages: finalMessages };
          setConversations((prev) =>
            prev.map((c) => (c.id === finalConv.id ? finalConv : c))
          );
          saveConversation(finalConv);
          return;
        }

        const transcript = transRes.transcript.trim();
        effectiveText = effectiveText ? `${effectiveText}\n${transcript}` : transcript;
        resolvedVoiceNote = { ...voiceNote, transcript };

        // Update the user's message bubble with the transcribed voice text
        const updatedUserMessage: ChatMessageType = {
          ...userMessage,
          content: effectiveText,
          voice_transcript: transcript,
        };
        updatedMessages = [...previousHistory, updatedUserMessage];
        if (newTitle === 'Voice Conversation' && transcript) {
          newTitle = transcript.length > 45 ? transcript.slice(0, 45) + '...' : transcript;
        }
        updatedConv = {
          ...updatedConv,
          title: newTitle,
          messages: updatedMessages,
          updated_at: Date.now() / 1000,
        };
        setConversations((prev) =>
          prev.map((c) => (c.id === updatedConv.id ? updatedConv : c))
        );
        saveConversation(updatedConv);
      }

      // Step 2: Determine appropriate loading state ("Generating image...", "Analyzing image...", or "NEXUS AI is thinking...")
      const hasAnyImage = Boolean(imageFile || hasHistoryImage);
      const willGenerateImage =
        Boolean(forceImageGen) || isLikelyImageGenPrompt(effectiveText, hasAnyImage);

      if (willGenerateImage) {
        setLoadingStatus('Generating image...');
      } else if (imageFile || (hasHistoryImage && !docFile)) {
        setLoadingStatus('Analyzing image...');
      } else {
        setLoadingStatus('NEXUS AI is thinking...');
      }

      // Step 3: Send multimodal request to backend
      const response = await sendChatMessage(
        effectiveText,
        activeConversation.id,
        currentMode,
        file,
        controller.signal,
        {
          history: previousHistory,
          voiceNote: resolvedVoiceNote,
          secondaryFile,
          forceImageGen,
        }
      );

      if (settings.soundEffects) sound.receive();

      const assistantMessage: ChatMessageType = {
        id: 'msg-bot-' + Date.now(),
        role: 'assistant',
        content: response.reply,
        ts: Date.now() / 1000,
        generated_image_b64: response.generated_image_b64,
        generated_image_mime: response.generated_image_mime,
        generated_prompt: response.generated_prompt,
        isError: response.status === 'error',
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      const finalConv: Conversation = {
        ...updatedConv,
        messages: finalMessages,
        updated_at: Date.now() / 1000,
      };

      setConversations((prev) =>
        prev.map((c) => (c.id === finalConv.id ? finalConv : c))
      );
      saveConversation(finalConv);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        const errorMsg: ChatMessageType = {
          id: 'msg-err-' + Date.now(),
          role: 'assistant',
          content: `⚠️ NEXUS AI couldn't complete that request. Please try again.`,
          ts: Date.now() / 1000,
          isError: true,
        };
        const finalMessages = [...updatedMessages, errorMsg];
        const finalConv = { ...updatedConv, messages: finalMessages };
        setConversations((prev) =>
          prev.map((c) => (c.id === finalConv.id ? finalConv : c))
        );
        saveConversation(finalConv);
      }
    } finally {
      setIsGenerating(false);
      setLoadingStatus('NEXUS AI is thinking...');
      abortControllerRef.current = null;
    }
  };

  // Stop Generation
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const stopMsg: ChatMessageType = {
      id: 'msg-stop-' + Date.now(),
      role: 'assistant',
      content: '⏹️ *Response generation stopped.*',
      ts: Date.now() / 1000,
    };

    const finalMessages = [...activeConversation.messages, stopMsg];
    const finalConv = {
      ...activeConversation,
      messages: finalMessages,
      updated_at: Date.now() / 1000,
    };

    setConversations((prev) =>
      prev.map((c) => (c.id === finalConv.id ? finalConv : c))
    );
    saveConversation(finalConv);
    setIsGenerating(false);
    setLoadingStatus('NEXUS AI is thinking...');
    abortControllerRef.current = null;
  };

  // Feedback up/down handler
  const handleFeedback = (index: number, feedback: 'up' | 'down') => {
    const updatedMessages = [...activeConversation.messages];
    if (updatedMessages[index]) {
      updatedMessages[index] = {
        ...updatedMessages[index],
        feedback: updatedMessages[index].feedback === feedback ? null : feedback,
      };
      const updatedConv = { ...activeConversation, messages: updatedMessages };
      setConversations((prev) =>
        prev.map((c) => (c.id === updatedConv.id ? updatedConv : c))
      );
      saveConversation(updatedConv);
    }
  };

  // Delete message handler
  const handleDeleteMessage = (index: number) => {
    const updatedMessages = activeConversation.messages.filter((_, i) => i !== index);
    const updatedConv = { ...activeConversation, messages: updatedMessages };
    setConversations((prev) =>
      prev.map((c) => (c.id === updatedConv.id ? updatedConv : c))
    );
    saveConversation(updatedConv);
  };

  // Regenerate last response
  const handleRegenerate = () => {
    if (activeConversation.messages.length < 2 || isGenerating) return;

    let lastUserMessage: ChatMessageType | null = null;
    for (let i = activeConversation.messages.length - 1; i >= 0; i--) {
      if (activeConversation.messages[i].role === 'user') {
        lastUserMessage = activeConversation.messages[i];
        break;
      }
    }

    if (!lastUserMessage) return;

    const trimmedMessages = activeConversation.messages.slice(0, -1);
    const updatedConv = { ...activeConversation, messages: trimmedMessages };
    setConversations((prev) =>
      prev.map((c) => (c.id === updatedConv.id ? updatedConv : c))
    );

    handleSendMessage(lastUserMessage.content, lastUserMessage.file, {
      secondaryFile: lastUserMessage.secondary_file,
    });
  };

  // Generated Image Action: Regenerate specific generated image
  const handleRegenerateImage = (msg: ChatMessageType) => {
    if (isGenerating) return;
    const promptToUse = msg.generated_prompt || 'Generate another variation of this image';
    handleSendMessage(promptToUse, undefined, { forceImageGen: true });
  };

  // Generated Image Action: Use generated image as reference in ChatInput
  const handleUseImageAsReference = (imageB64: string, mimeType: string) => {
    const dataUrl = `data:${mimeType};base64,${imageB64}`;
    const approxBytes = Math.round((imageB64.length * 3) / 4);
    setExternalAttachment({
      name: `reference-image-${Date.now()}.png`,
      size: approxBytes,
      type: mimeType,
      mimeType,
      url: dataUrl,
      content: imageB64,
      base64: imageB64,
      isImage: true,
    });
    composerInputRef.current?.focus();
  };

  // Generated Image Action: Ask about generated image
  const handleAskAboutImage = (imageB64: string, mimeType: string) => {
    const dataUrl = `data:${mimeType};base64,${imageB64}`;
    const approxBytes = Math.round((imageB64.length * 3) / 4);
    setExternalAttachment({
      name: `generated-image-${Date.now()}.png`,
      size: approxBytes,
      type: mimeType,
      mimeType,
      url: dataUrl,
      content: imageB64,
      base64: imageB64,
      isImage: true,
    });
    composerInputRef.current?.focus();
  };

  return (
    <div
      style={{
        backgroundColor: palette.colors.bg,
        color: palette.colors.text,
      }}
      className="min-h-screen flex flex-col transition-colors relative"
    >
      {/* Ambient background glow for high-contrast immersion */}
      <div
        style={{
          background: `radial-gradient(circle 600px at 50% 5%, ${palette.colors.glow}, transparent 70%)`,
        }}
        className="fixed inset-0 pointer-events-none z-0 opacity-40"
      />

      {/* Sidebar */}
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        pinnedIds={pinnedIds}
        currentMode={currentMode}
        settings={settings}
        isOpen={isMobileSidebarOpen}
        searchQuery={searchQuery}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
        onDeleteAllConversations={handleDeleteAllConversations}
        onTogglePin={handleTogglePin}
        onModeChange={(mode) => setCurrentMode(mode)}
        onPaletteChange={(pal) => {
          const targetPal = getPalette(pal);
          setSettings((prev) => ({
            ...prev,
            palette: pal,
            theme: targetPal.isLight ? 'light' : 'dark',
          }));
        }}
        onExportChat={() => exportChatToMarkdown(activeConversation)}
        onToggleTheme={() =>
          setSettings((prev) => ({
            ...prev,
            palette: prev.theme === 'light' ? 'cyber-cyan' : 'lunar-light',
            theme: prev.theme === 'light' ? 'dark' : 'light',
          }))
        }
        onFontSizeChange={(size) => setSettings((prev) => ({ ...prev, fontSize: size }))}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        isCollapsed={isSidebarCollapsed}
      />

      {/* Main Workspace Frame */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 relative z-10
          ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72 sm:lg:pl-80'}
        `}
      >
        {/* Header */}
        <Header
          title={activeConversation.title}
          totalMessages={totalMessages}
          userMessages={userMessages}
          assistantMessages={assistantMessages}
          isPinned={isPinned}
          currentMode={currentMode}
          settings={settings}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onTogglePin={() => handleTogglePin()}
          onExportChat={() => exportChatToMarkdown(activeConversation)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
          onUpdateTitle={handleUpdateTitle}
          onPaletteChange={(pal) => {
            const targetPal = getPalette(pal);
            setSettings((prev) => ({
              ...prev,
              palette: pal,
              theme: targetPal.isLight ? 'light' : 'dark',
            }));
          }}
          onToggleSound={() =>
            setSettings((prev) => ({ ...prev, soundEffects: !prev.soundEffects }))
          }
        />

        {/* Scrollable Chat Area */}
        <main
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth pb-44"
        >
          <div className="max-w-[1050px] mx-auto w-full">
            {activeConversation.messages.length === 0 ? (
              <WelcomeScreen
                settings={settings}
                onSelectPrompt={(promptText) => {
                  handleSendMessage(promptText);
                }}
              />
            ) : (
              <div className="space-y-4">
                {activeConversation.messages.map((message, index) => {
                  const isLastAssistant =
                    message.role === 'assistant' &&
                    index === activeConversation.messages.length - 1;

                  return (
                    <ChatMessage
                      key={message.id || index}
                      message={message}
                      index={index}
                      fontSize={settings.fontSize}
                      settings={settings}
                      isLastAssistant={isLastAssistant}
                      isGenerating={isGenerating}
                      onFeedback={handleFeedback}
                      onDeleteMessage={handleDeleteMessage}
                      onRegenerate={handleRegenerate}
                      onRegenerateImage={handleRegenerateImage}
                      onUseImageAsReference={handleUseImageAsReference}
                      onAskAboutImage={handleAskAboutImage}
                    />
                  );
                })}

                {/* Live Processing Indicator with context-specific loading state */}
                {isGenerating && (
                  <div className="w-full py-2 flex flex-col items-start animate-fadeIn">
                    <div
                      style={{
                        backgroundColor: palette.colors.surface,
                        borderColor: palette.colors.borderHighlight,
                        boxShadow: `0 8px 30px ${palette.colors.glow}`,
                      }}
                      className="rounded-2xl p-4 border max-w-[85%] sm:max-w-[75%]"
                    >
                      <div
                        style={{ color: palette.colors.primary }}
                        className="flex items-center justify-between gap-4 text-xs font-bold mb-1.5"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            style={{ backgroundColor: palette.colors.primary }}
                            className="w-2.5 h-2.5 rounded-full animate-ping"
                          />
                          <span>{loadingStatus}</span>
                        </div>
                        <span className="font-mono text-[11px] opacity-75 font-normal">
                          Neural Engine active
                        </span>
                      </div>
                      <div
                        style={{ color: palette.colors.textMuted }}
                        className="flex items-center gap-2 text-xs font-mono"
                      >
                        <span className="animate-pulse">Querying neural model & tool pipeline</span>
                        <div className="flex gap-1">
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce"
                            style={{ animationDelay: '0ms' }}
                          />
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce"
                            style={{ animationDelay: '150ms' }}
                          />
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce"
                            style={{ animationDelay: '300ms' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>

        {/* Fixed Bottom Composer Container */}
        <div
          style={{
            backgroundColor: `${palette.colors.bg}EE`,
            borderColor: palette.colors.border,
          }}
          className={`fixed bottom-0 right-0 left-0 z-30 transition-all duration-300 px-4 py-4 backdrop-blur-xl border-t
            ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72 sm:lg:pl-80'}
          `}
        >
          <ChatInput
            onSendMessage={handleSendMessage}
            onStopGeneration={handleStopGeneration}
            isGenerating={isGenerating}
            enterToSend={settings.enterToSend}
            currentMode={currentMode}
            settings={settings}
            inputRef={composerInputRef}
            externalAttachment={externalAttachment}
            onClearExternalAttachment={() => setExternalAttachment(null)}
            onQuickAction={(actionText) => {
              if (composerInputRef.current) {
                composerInputRef.current.value = actionText;
                composerInputRef.current.focus();
              }
            }}
          />
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={(newSettings) =>
          setSettings((prev) => ({ ...prev, ...newSettings }))
        }
      />

      {/* Quick Search Dialog (Cmd/Ctrl+K) */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        conversations={conversations}
        onSelectConversation={handleSelectConversation}
        settings={settings}
      />
    </div>
  );
}
