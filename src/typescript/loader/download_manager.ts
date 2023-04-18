import LoadingBar from './loading_bar';
import { AudioLoader } from './audio_loader';
import { LoadFinished, LoadProgressed, LoadResult, Where } from './loader_types';

export class DownloadManager {
  private downloading: Map<HTMLElement, LoadingBar>;

  constructor() {
    this.downloading = new Map();
  }

  private onLoadProgressed: LoadProgressed = (audio: HTMLElement, progress: number) => {
    const bar = this.downloading.get(audio) as LoadingBar;
    bar.setProgress(progress);
  };

  private onLoadFinished: LoadFinished = (
    audio: HTMLElement,
    result: LoadResult,
    where?: Where
  ) => {
    const bar = this.downloading.get(audio) as LoadingBar;
    if (result === LoadResult.Error) {
      bar.throw();
      console.error('Failed at ' + where);
    } else {
      bar.finish();
    }
  };

  download = (audio: HTMLElement) => {
    if (this.downloading.has(audio)) return;

    const bar = new LoadingBar(audio, () => this.downloading.delete(audio));
    this.downloading.set(audio, bar);

    const loader = new AudioLoader(audio, this.onLoadProgressed, this.onLoadFinished);
    loader.download();
  };
}
