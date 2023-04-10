const enum LoadState {
  Loading = 'vk_audio__loading',
  Error = 'vk_audio__error',
}

const enum LoadingBars {
  Outer = 'vk_audio__bar_outer',
  Inner = 'vk_audio__bar_inner',
}

const ANIMATION_DURATION = 200;

class LoadingBar {
  private audio: HTMLElement;
  private content: HTMLElement;
  private barOuter: HTMLElement;
  private barInner: HTMLElement;

  private error: boolean;

  constructor(audio: HTMLElement) {
    this.error = false;
    this.audio = audio;
    this.audio.classList.add(LoadState.Loading);
    this.audio.style.height = `${this.audio.clientHeight + 2}px`;

    this.content = this.audio.children[0] as HTMLElement;
    this.content.style.height = `${this.content.clientHeight}px`;

    this.mount();
  }

  private mount = () => {
    const barOuter = document.createElement('div');
    barOuter.classList.add(LoadingBars.Outer, 'hidden');

    const barInner = document.createElement('div');
    barInner.classList.add(LoadingBars.Inner);

    barOuter.insertBefore(barInner, null);
    this.audio.insertBefore(barOuter, null);
    barOuter.classList.remove('hidden');

    this.barOuter = barOuter;
    this.barInner = barInner;
  };

  private unmount = () => {
    this.barOuter.classList.add('hidden');
    this.audio.style.height = `${this.audio.clientHeight - 2}px`;
    this.content.style.removeProperty('height');
    setTimeout(() => {
      this.barOuter.remove();
      this.audio.classList.remove(LoadState.Loading);
    }, ANIMATION_DURATION);
  };

  setProgress = (percentage: number) => {
    if (this.error) return;

    this.barInner.style.width = `${(this.barOuter.clientWidth * percentage) / 100}px`;
    if (percentage === 100)
      setTimeout(() => {
        this.unmount();
      }, ANIMATION_DURATION);
  };

  throw = () => {
    this.error = true;
    this.barOuter.classList.add(LoadState.Error);
    setTimeout(this.unmount, ANIMATION_DURATION * 10);
  };
}

export default LoadingBar;
