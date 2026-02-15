/**
 * Convert a form file (or file-like) to a base64 data URL for storing in DB.
 * Works in Node without relying on the global File class.
 */
const MAX_SIZE_BYTES = 500 * 1024; // 500KB to keep DB row reasonable

export async function fileToBase64DataUrl(file: { arrayBuffer: () => Promise<ArrayBuffer>; type?: string }): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  if (buffer.length > MAX_SIZE_BYTES) {
    throw new Error(`Image must be under ${Math.round(MAX_SIZE_BYTES / 1024)}KB for database storage.`);
  }
  const base64 = buffer.toString('base64');
  const mime = (file as { type?: string }).type || 'image/jpeg';
  return `data:${mime};base64,${base64}`;
}

export const MAX_IMAGE_SIZE_BYTES = MAX_SIZE_BYTES;
