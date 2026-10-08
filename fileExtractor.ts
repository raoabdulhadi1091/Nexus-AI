import { AttachedFile } from '../types';

export const SUPPORTED_EXTENSIONS = [
  'pdf',
  'txt',
  'csv',
  'xlsx',
  'xls',
  'docx',
  'json',
  'py',
  'md',
  'jpg',
  'jpeg',
  'png',
  'webp',
  'mp3',
  'wav',
  'm4a',
  'mp4',
  'webm',
  'ogg',
];

const IMAGE_MIME_MAP: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
};

const AUDIO_MIME_MAP: Record<string, string> = {
  mp3: 'audio/mp3',
  wav: 'audio/wav',
  m4a: 'audio/m4a',
  mp4: 'audio/mp4',
  webm: 'audio/webm',
  ogg: 'audio/ogg',
};

export function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  }
  return `${bytes} bytes`;
}

export function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2).toLowerCase();
}

/**
 * Inspects file magic bytes to verify genuine image/audio format rather than trusting extension alone.
 */
async function detectMagicMimeType(file: File): Promise<string | null> {
  try {
    const slice = file.slice(0, 16);
    const buffer = await slice.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    if (bytes.length < 4) return null;

    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
      return 'image/png';
    }
    // JPEG: FF D8 FF
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      return 'image/jpeg';
    }
    // RIFF container: WEBP or WAV
    if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes.length >= 12) {
      if (bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
        return 'image/webp';
      }
      if (bytes[8] === 0x57 && bytes[9] === 0x41 && bytes[10] === 0x56 && bytes[11] === 0x45) {
        return 'audio/wav';
      }
    }
    // OGG: 4F 67 67 53 ("OggS")
    if (bytes[0] === 0x4f && bytes[1] === 0x67 && bytes[2] === 0x67 && bytes[3] === 0x53) {
      return 'audio/ogg';
    }
    // WEBM / Matroska: 1A 45 DF A3
    if (bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) {
      return 'audio/webm';
    }
    // MP3: ID3 tag (49 44 33) or MPEG sync word (FF FB / FF F3 / FF F2)
    if (
      (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) ||
      (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0)
    ) {
      return 'audio/mp3';
    }
    // MP4 / M4A ftyp box at offset 4: 66 74 79 70
    if (bytes.length >= 8 && bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) {
      return 'audio/m4a';
    }
  } catch {
    // Fallback to browser MIME type if slice read fails
  }
  return null;
}

export async function validateUploadedFile(file: File): Promise<{ valid: boolean; error?: string }> {
  if (!file) {
    return { valid: false, error: 'No file provided.' };
  }

  const maxBytes = 50 * 1024 * 1024; // 50MB practical limit for safe payload processing
  if (file.size > maxBytes) {
    return { valid: false, error: 'File exceeds 50MB upload limit. Please select a smaller file.' };
  }

  const ext = getFileExtension(file.name);
  const isImageMime = file.type.startsWith('image/');
  const isAudioMime = file.type.startsWith('audio/');

  if (!SUPPORTED_EXTENSIONS.includes(ext) && !isImageMime && !isAudioMime) {
    return {
      valid: false,
      error: `Unsupported file type (.${ext || 'unknown'}). Supported formats include PNG, JPG, WEBP, MP3, WAV, M4A, WEBM, OGG, PDF, DOCX, CSV, XLSX, TXT, PY, JSON, MD.`,
    };
  }

  if (['jpg', 'jpeg', 'png', 'webp'].includes(ext) || isImageMime) {
    const magicMime = await detectMagicMimeType(file);
    if (!magicMime || !magicMime.startsWith('image/')) {
      return {
        valid: false,
        error: 'Invalid image file content. Supported formats are PNG, JPG, JPEG, and WEBP.',
      };
    }
  }

  return { valid: true };
}

export async function processUploadedFile(file: File): Promise<AttachedFile> {
  const ext = getFileExtension(file.name);
  const magicMime = await detectMagicMimeType(file);

  const isImage =
    ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ||
    (magicMime !== null && magicMime.startsWith('image/')) ||
    file.type.startsWith('image/');

  const isAudio =
    ['mp3', 'wav', 'm4a', 'mp4', 'webm', 'ogg'].includes(ext) ||
    (magicMime !== null && magicMime.startsWith('audio/')) ||
    file.type.startsWith('audio/');

  const resolvedMime =
    magicMime ||
    file.type ||
    (isImage ? IMAGE_MIME_MAP[ext] || 'image/png' : isAudio ? AUDIO_MIME_MAP[ext] || 'audio/mp3' : `application/${ext}`);

  const attached: AttachedFile = {
    name: file.name,
    size: file.size,
    type: resolvedMime,
    mimeType: resolvedMime,
    isImage,
    isAudio,
  };

  if (isImage) {
    const dataUrl = await readFileAsBase64(file);
    attached.url = dataUrl;
    const commaIndex = dataUrl.indexOf(',');
    const rawBase64 = commaIndex !== -1 ? dataUrl.slice(commaIndex + 1) : dataUrl;
    attached.content = rawBase64;
    attached.base64 = rawBase64;
    return attached;
  }

  if (isAudio) {
    attached.url = URL.createObjectURL(file);
    const dataUrl = await readFileAsBase64(file);
    const commaIndex = dataUrl.indexOf(',');
    const rawBase64 = commaIndex !== -1 ? dataUrl.slice(commaIndex + 1) : dataUrl;
    attached.content = rawBase64;
    attached.base64 = rawBase64;
    return attached;
  }

  // Text-based or code files (strictly read as plain text, never executed)
  if (['txt', 'csv', 'json', 'py', 'md', 'html', 'js', 'ts'].includes(ext)) {
    try {
      const text = await readFileAsText(file);
      attached.content = text.slice(0, 30000);
      return attached;
    } catch (err) {
      console.error('Error reading text file:', err);
    }
  }

  // For PDF, DOCX, XLSX: read as text/binary extract or note
  try {
    const raw = await readFileAsText(file);
    const clean = raw.replace(/[^\x20-\x7E\t\n\r]/g, ' ').replace(/\s{2,}/g, ' ');
    if (clean.length > 50) {
      attached.content = clean.slice(0, 20000);
    }
  } catch {
    // If raw extraction fails, backend will note it
  }

  return attached;
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
