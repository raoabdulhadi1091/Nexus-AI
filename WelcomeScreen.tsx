import React from 'react';
import {
  Code,
  FileSpreadsheet,
  FileText,
  PenTool,
  Brain,
  Calculator,
  Terminal,
  Layers,
  Sparkles,
  Zap,
} from 'lucide-react';
import { AppSettings } from '../types';
import { getPalette } from '../utils/themePalettes';
import { sound } from '../utils/soundEffects';

interface WelcomeScreenProps {
  onSelectPrompt: (promptText: string) => void;
  settings: AppSettings;
}

const CAPABILITY_CARDS = [
  {
    icon: Code,
    category: 'Coding & Architecture',
    prompt: 'Debug my code, optimize runtime performance, and provide clean, production-ready implementation.',
    accent: '#38BDF8',
  },
  {
    icon: FileSpreadsheet,
    category: 'Data Science & Analytics',
    prompt: 'Help me clean and perform exploratory data analysis on a dataset using pandas and NumPy with statistical takeaways.',
    accent: '#34D399',
  },
  {
    icon: FileText,
    category: 'Document & Knowledge Extraction',
    prompt: 'Analyze this attached document, extract core facts, and provide an executive summary with action items.',
    accent: '#818CF8',
  },
  {
    icon: PenTool,
    category: 'Executive Writing & Strategy',
    prompt: 'Draft a crisp, persuasive project proposal outlining milestones, budget, risks, and KPIs.',
    accent: '#FBBF24',
  },
  {
    icon: Brain,
    category: 'Deep Technical Explanations',
    prompt: 'Explain how attention mechanisms in transformers work with an intuitive step-by-step breakdown and diagrams.',
    accent: '#C084FC',
  },
  {
    icon: Calculator,
    category: 'Mathematical Reasoning',
    prompt: 'Solve this quantitative problem showing each logical deduction and formatted equation clearly.',
    accent: '#FB7185',
  },
];

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onSelectPrompt,
  settings,
}) => {
  const palette = getPalette(settings.palette);

  return (
    <div className="flex flex-col items-center justify-center max-w-4xl mx-auto px-4 py-8 sm:py-12">
      {/* Central Welcome Card */}
      <div
        style={{
          background: `linear-gradient(145deg, ${palette.colors.surface} 0%, ${palette.colors.bgSubtle} 100%)`,
          borderColor: palette.colors.borderHighlight,
          boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 40px ${palette.colors.glow}`,
        }}
        className="w-full text-center rounded-3xl p-7 sm:p-11 mb-8 border relative overflow-hidden transition-all"
      >
        {/* Futuristic glowing badge */}
        <div
          style={{
            backgroundColor: palette.colors.primarySubtle,
            borderColor: palette.colors.borderHighlight,
            color: palette.colors.primary,
          }}
          className="inline-flex items-center justify-center w-14 h-14 rounded-2xl border mb-4 shadow-lg text-2xl font-bold"
        >
          ✦
        </div>

        <h2
          style={{
            background: palette.colors.ring,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
          className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-3 font-heading"
        >
          Welcome to the Neural Workspace
        </h2>

        <p
          style={{ color: palette.colors.textMuted }}
          className="text-sm sm:text-base max-w-xl mx-auto leading-relaxed font-medium"
        >
          Your AI command center is ready. Ask questions, write code, analyze documents, process
          datasets, or attach files and let NEXUS AI work for you.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs font-mono">
          <span
            style={{
              backgroundColor: palette.colors.primarySubtle,
              borderColor: palette.colors.border,
              color: palette.colors.primary,
            }}
            className="px-3 py-1 rounded-full border flex items-center gap-1.5 font-semibold"
          >
            <span
              style={{ backgroundColor: palette.colors.accent }}
              className="w-2 h-2 rounded-full animate-pulse"
            />
            n8n Production Neural Node Active
          </span>
          <span
            style={{
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderColor: palette.colors.border,
              color: palette.colors.textMuted,
            }}
            className="px-3 py-1 rounded-full border"
          >
            16+ File Formats Supported
          </span>
        </div>
      </div>

      {/* Task & Workflow Suggestions Grid */}
      <div className="w-full">
        <div className="flex items-center justify-between mb-3 px-1 text-xs uppercase tracking-wider font-bold">
          <span style={{ color: palette.colors.textMuted }}>Explore Workflows & Capabilities</span>
          <span style={{ color: palette.colors.primary }} className="font-normal normal-case">
            Click to populate prompt
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {CAPABILITY_CARDS.map((card, idx) => {
            const Icon = card.icon;
            return (
              <button
                key={idx}
                onClick={() => {
                  if (settings.soundEffects) sound.click();
                  onSelectPrompt(card.prompt);
                }}
                style={{
                  backgroundColor: palette.colors.surface,
                  borderColor: palette.colors.border,
                }}
                className="group text-left p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 hover:border-cyan-400 hover:scale-[1.02] active:scale-[0.98] shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      style={{
                        backgroundColor: `${card.accent}18`,
                        color: card.accent,
                      }}
                      className="p-1.5 rounded-lg font-bold"
                    >
                      <Icon size={16} />
                    </div>
                    <span
                      style={{ color: palette.colors.text }}
                      className="text-xs font-bold group-hover:text-cyan-300 transition-colors"
                    >
                      {card.category}
                    </span>
                  </div>
                  <span
                    style={{ color: palette.colors.primary }}
                    className="opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-xs font-bold"
                  >
                    →
                  </span>
                </div>

                <p
                  style={{ color: palette.colors.textMuted }}
                  className="text-xs leading-relaxed line-clamp-2"
                >
                  {card.prompt}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
