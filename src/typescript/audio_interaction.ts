import { onInteractionOver } from './types';
import InformativeMO from './InformativeMutationObserver';

import { hasAppeared, createDownloadButton, UI_ELEMENTS } from './DOM_helpers';

const ObserverConfig = {
  style: {
    attributeFilter: ['style'],
  },
  tree: {
    subtree: true,
    childList: true,
  },
};

class Interaction {
  private actionList: HTMLElement | null;
  private audio: HTMLElement;
  private moreButton: HTMLElement;
  private isOnAudio: boolean;

  private onOver: onInteractionOver;

  appearanceObserver: MutationObserver;
  disappearanceObserver: InformativeMO;
  updateObserver: MutationObserver;

  constructor(audio: HTMLElement, moreButton: HTMLElement, onOver: onInteractionOver) {
    this.actionList = null;
    this.isOnAudio = true;
    this.onOver = onOver;

    this.audio = audio;
    this.audio.addEventListener('mouseenter', this.audioMouseEnter);
    this.audio.addEventListener('mouseleave', this.audioMouseLeave);
    this.audio.addEventListener('click', this.audioClick);

    this.moreButton = moreButton;
    moreButton.addEventListener('mouseenter', this.moreButtonMouseEnter);
    moreButton.addEventListener('mouseleave', this.moreButtonMouseLeave);
  }

  private audioMouseEnter = () => (this.isOnAudio = true);

  private audioMouseLeave = () => {
    this.isOnAudio = false;
    if (this.isActionListActive()) {
      if (this.disappearanceObserver.isObserving()) return;

      this.disappearanceObserver.observe(this.actionList as HTMLElement, ObserverConfig.style);
    } else {
      this.cleanup();
    }
  };

  private audioClick = () => {
    this.updateObserver.observe(this.audio, ObserverConfig.tree);
  };

  private moreButtonMouseEnter = () => {
    // In case mouseleave on audio element has not fired
    // and the modified list is already in the DOM
    if (this.actionList !== null) return;

    this.appearanceObserver.observe(document.body, ObserverConfig.tree);
  };

  private moreButtonMouseLeave = () => {
    if (this.actionList !== null) return;

    // In case the interaction was so fast the list had not appeared
    this.appearanceObserver.disconnect();
  };

  private actionListMouseEnter = () => {
    this.isOnAudio = true;
    this.disappearanceObserver.disconnect();
  };

  private actionListMouseLeave = () => {
    this.isOnAudio = false;
    this.disappearanceObserver.observe(this.actionList as HTMLElement, ObserverConfig.style);
  };

  private isActionListActive = () => {
    if (this.actionList === null) return false;

    return this.actionList.style.display !== 'none';
  };

  cleanup = () => {
    this.onOver(this.audio);
    if (this.actionList !== null) this.actionList.parentNode?.removeChild(this.actionList);

    this.audio.removeEventListener('mouseenter', this.audioMouseEnter);
    this.audio.removeEventListener('mouseleave', this.audioMouseLeave);
    this.audio.removeEventListener('click', this.audioClick);
  };

  onActionsAppeared = () => {
    const actionLists = hasAppeared(UI_ELEMENTS.actionList);
    if (actionLists === null) return;

    this.appearanceObserver.disconnect();

    this.actionList = actionLists[actionLists.length - 1];

    createDownloadButton(this.audio, this.actionList);

    this.actionList.addEventListener('mouseleave', this.actionListMouseLeave);
    this.actionList.addEventListener('mouseenter', this.actionListMouseEnter);
  };

  onActionsDisappeared = () =>
    this.isOnAudio ? this.disappearanceObserver.disconnect() : this.cleanup();

  onMoreButtonUpdated = () => {
    const moreButtons = hasAppeared(UI_ELEMENTS.moreButton, this.audio);
    if (moreButtons === null) return;

    this.updateObserver.disconnect();

    if (this.actionList !== null) {
      this.actionList.parentNode?.removeChild(this.actionList);
      this.actionList = null;
    }

    this.moreButton = moreButtons[0] as HTMLElement;
    this.moreButton.addEventListener('mouseenter', this.moreButtonMouseEnter);
    this.moreButton.addEventListener('mouseleave', this.moreButtonMouseLeave);
  };
}

class AudioInteractionWatcher {
  private interactedAudios: Map<Element, Interaction>;

  audioOverWatcher: MutationObserver;

  constructor() {
    this.interactedAudios = new Map();
  }

  private onInteractionOver = (audio: HTMLElement) => this.interactedAudios.delete(audio);

  private initInteraction = (audio: HTMLElement, moreButton: HTMLElement) => {
    const interaction = new Interaction(audio, moreButton, this.onInteractionOver);

    interaction.appearanceObserver = new MutationObserver(interaction.onActionsAppeared);
    interaction.disappearanceObserver = new InformativeMO(interaction.onActionsDisappeared);
    interaction.updateObserver = new MutationObserver(interaction.onMoreButtonUpdated);

    this.interactedAudios.set(audio, interaction);
  };

  onAudioOver = () => {
    const moreButtons = hasAppeared(UI_ELEMENTS.moreButton);
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

export default AudioInteractionWatcher;
