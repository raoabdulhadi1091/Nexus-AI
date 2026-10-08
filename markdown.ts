import { marked } from 'marked';

// Configure marked options
marked.setOptions({
  gfm: true,
  breaks: true,
});

export function renderMarkdown(content: string): string {
  if (!content) return '';

  try {
    const rawHtml = marked.parse(content) as string;
    return rawHtml;
  } catch (err) {
    console.error('Markdown rendering error:', err);
    return escapeHtml(content);
  }
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function formatTimestamp(ts: number): string {
  if (!ts) return '';
  try {
    const date = new Date(ts > 10000000000 ? ts : ts * 1000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export function formatRelativeDate(ts: number): string {
  if (!ts) return '';
  const now = Date.now();
  const time = ts > 10000000000 ? ts : ts * 1000;
  const diffMs = now - time;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay}d ago`;

  return new Date(time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
