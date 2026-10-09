/** A photo picked for a spot, shrunk for sharing and for the AI identifier. */
export interface PhotoAsset {
  /** Displayable URI of the original (file:// on device, blob: on web). */
  uri: string;
  /** ~320px JPEG data URL. Small enough to sync and store. */
  thumb: string;
  width: number;
  height: number;
  /** ~1024px JPEG for the identifier (web). */
  aiBlob?: Blob;
  /** ~1024px JPEG base64 for the identifier (native → edge function). */
  aiBase64?: string;
}

export type PhotoSource = 'camera' | 'library';
