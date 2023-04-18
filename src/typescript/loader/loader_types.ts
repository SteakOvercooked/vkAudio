export const enum Where {
  StreamUrl = 'stream url',
  Playlist = 'playlist',
  Key = 'key',
  Segments = 'segments',
  Convertation = 'convertation',
}

export const enum LoadResult {
  Success = 0,
  Error = 1,
}

export type LoadFinished = {
  (audio: HTMLElement, result: LoadResult.Success): void;
  (audio: HTMLElement, result: LoadResult.Error, where: Where): void;
};
export type LoadProgressed = (audio: HTMLElement, progress: number) => void;

export type SegmentsInfo = { isEncrypted: boolean; mediaSequence: number }[];
