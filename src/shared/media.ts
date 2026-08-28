const SUPPORTED_AUDIO_EXTENSIONS = new Set([
  '.aac',
  '.aif',
  '.aiff',
  '.flac',
  '.m4a',
  '.mp3',
  '.mp4',
  '.ogg',
  '.opus',
  '.wav',
  '.webm',
]);

export function createTrackId(filePath: string): string {
  return filePath;
}

export function fileNameFromPath(filePath: string): string {
  return filePath.split(/[\\/]/).at(-1) ?? filePath;
}

export function isSupportedAudioPath(filePath: string): boolean {
  const extensionMatch = filePath.match(/\.[^./\\]+$/);
  return extensionMatch
    ? SUPPORTED_AUDIO_EXTENSIONS.has(extensionMatch[0].toLowerCase())
    : false;
}

export function trackTitleFromPath(filePath: string): string {
  const fileName = fileNameFromPath(filePath);
  return fileName.replace(/\.[^./\\]+$/, '').replace(/[_-]+/g, ' ').trim();
}
