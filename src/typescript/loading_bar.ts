const enum LoadState {
  Loading = 'vk_audio__loading',
  Error = 'vk_audio__error',
}

const enum LoadingBars {
  Outer = 'vk_audio__bar_outer',
  Inner = 'vk_audio__bar_inner',
}

const ANIMATION_DURATION = 300;

class LoadingBar {
  private barOuter: HTMLElement;
  private barInner: HTMLElement;

  private error: boolean;

  constructor(audio: HTMLElement) {
    this.error = false;

    const barOuter = document.createElement('div');
    barOuter.classList.add(LoadingBars.Outer, 'in');

    const barInner = document.createElement('div');
    barInner.classList.add(LoadingBars.Inner);

    barOuter.insertBefore(barInner, null);
    audio.insertBefore(barOuter, null);
    barOuter.offsetTop;
    barOuter.classList.remove('in');

    this.barOuter = barOuter;
    this.barInner = barInner;
  }

  private unmount = () => {
    this.barOuter.classList.add('out');
    setTimeout(() => {
      this.barOuter.remove();
    }, ANIMATION_DURATION);
  };

  setProgress = (percentage: number) => {
    if (this.error) return;

    this.barInner.style.width = `${(this.barOuter.clientWidth * percentage) / 100}px`;
    if (percentage === 100) setTimeout(this.unmount, ANIMATION_DURATION);
  };

  throw = () => {
    this.error = true;
    this.barOuter.classList.add(LoadState.Error);
    this.barInner.style.width = `${this.barOuter.clientWidth}px`;
    setTimeout(this.unmount, ANIMATION_DURATION * 7);
  };
}

export default LoadingBar;
