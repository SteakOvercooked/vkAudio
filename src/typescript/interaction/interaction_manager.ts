import Interaction from './interaction';
import { DownloadManager } from '../loader/download_manager';
import InformativeMO from './informative_mutation_observer';
import { hasAppeared } from './interaction_utils';
import { UI_Elements, ObserverConfig } from './interaction_types';

export default class AudioInteractionWatcher {
  private interactedAudios: Map<Element, Interaction>;
  private manager: DownloadManager;

  audioOverWatcher: MutationObserver;

  constructor() {
    this.interactedAudios = new Map();
    this.manager = new DownloadManager();
  }

  private onInteractionOver = (audio: HTMLElement) => this.interactedAudios.delete(audio);

  private attachLoader = (btn: HTMLButtonElement, audio: HTMLElement) =>
    btn.addEventListener('click', () => this.manager.download(audio));

  private initInteraction = (audio: HTMLElement, moreButton: HTMLElement) => {
    const interaction = new Interaction(
      audio,
      moreButton,
      this.onInteractionOver,
      this.attachLoader
    );

    interaction.appearanceObserver = new MutationObserver(interaction.onActionsAppeared);
    interaction.disappearanceObserver = new InformativeMO(interaction.onActionsDisappeared);
    interaction.updateObserver = new MutationObserver(interaction.onMoreButtonUpdated);

    this.interactedAudios.set(audio, interaction);
  };

  onAudioOver = () => {
    const moreButtons = hasAppeared(UI_Elements.MoreButton);
    if (moreButtons === null) return;

    for (let i = 0; i < moreButtons.length; i++) {
      const audio = moreButtons[i].closest('.audio_row') as HTMLElement;

      if (!this.interactedAudios.has(audio)) {
        this.initInteraction(audio, moreButtons[i]);
      }
    }
  };

  run = () => {
    this.audioOverWatcher.observe(document.body, ObserverConfig.tree);
  };
}
