export interface PendingImage {
  base64: string;
  mimeType: string;
  filename: string;
}

let pending: PendingImage | null = null;

export function setPendingImage(img: PendingImage) { pending = img; }
export function getPendingImage(): PendingImage | null { return pending; }
export function clearPendingImage() { pending = null; }
