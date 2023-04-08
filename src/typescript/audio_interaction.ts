import downloadAudio from './downloadAudio';

import {
  hasAppeared,
  createDownloadButton,
  insertDownloadButton,
  UI_ELEMENTS,
} from './DOM_helpers';

type onInteractionOver = (audio: HTMLElement) => boolean;

class Interaction {
  private actionList: HTMLElement | null;
  private audio: HTMLElement;
  private isInteracting: boolean;
  private isActionListWatched: boolean;

  private onOver: onInteractionOver;

  appearanceObserver: MutationObserver;
  disappearanceObserver: MutationObserver;

  constructor(audioElement: HTMLElement, moreButton: HTMLElement, onOver: onInteractionOver) {
    this.actionList = null;
    this.isInteracting = true;
    this.isActionListWatched = false;
    this.onOver = onOver;

    this.audio = audioElement;
    this.audio.addEventListener('mouseenter', this.audioMouseEnter);
    this.audio.addEventListener('mouseleave', this.audioMouseLeave);

    moreButton.addEventListener('mouseenter', this.moreButtonMouseEnter);
    moreButton.addEventListener('mouseleave', this.moreButtonMouseLeave);
  }

  private audioMouseEnter = () => (this.isInteracting = true);

  private audioMouseLeave = (e: MouseEvent) => {
    this.isInteracting = false;
    if (this.isActionListActive()) {
      if (this.isActionListWatched) return;

      this.disappearanceObserver.observe(this.actionList as HTMLElement, {
        attributeFilter: ['style'],
      });
    } else {
      this.cleanup();
    }
  };

  private moreButtonMouseEnter = () => {
    // In case mouseleave on audio element has not fired
    // and the modified list is already in the DOM
    if (this.actionList !== null) return;

    this.appearanceObserver.observe(document.body, {
      subtree: true,
      childList: true,
    });
    console.log('%cSTARTED OBSERVING FOR ACTIONS', 'color: green');
  };

  private moreButtonMouseLeave = () => {
    if (this.actionList !== null) return;

    // In case the interaction was so fast the list had not appeared
    this.appearanceObserver.disconnect();
    console.log('%cSTOPPED OBSERVING FOR ACTIONS', 'color: red');
  };

  private actionListMouseEnter = () => {
    this.isInteracting = true;
    this.disappearanceObserver.disconnect();
    this.isActionListWatched = false;
  };

  private actionListMouseLeave = () => {
    this.isInteracting = false;
    this.disappearanceObserver.observe(this.actionList as HTMLElement, {
      attributeFilter: ['style'],
    });
    this.isActionListWatched = true;
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
  };

  onActionsAppeared = () => {
    const actionLists = hasAppeared(UI_ELEMENTS.actionList);
    if (actionLists === null) return;

    this.appearanceObserver.disconnect();
    console.log('%cSTOPPED OBSERVING FOR ACTIONS', 'color: red');

    this.actionList = actionLists[actionLists.length - 1];

    console.log('%cACTION LIST APPEARED', 'color: yellow');

    const downloadButton = createDownloadButton();
    downloadButton.addEventListener('click', () => {
      downloadAudio(this.audio.getAttribute('data-audio') as string);
    });
    insertDownloadButton(downloadButton, this.actionList);

    this.actionList.addEventListener('mouseleave', this.actionListMouseLeave);
    this.actionList.addEventListener('mouseenter', this.actionListMouseEnter);
  };

  onActionsDisappeared = () => {
    if (this.isInteracting) {
      this.disappearanceObserver.disconnect();
      this.isActionListWatched = false;
    } else this.cleanup();
  };
}

class AudioInteractionWatcher {
  private interactedAudios: Map<Element, Interaction>;

  audioOverWatcher: MutationObserver;

  constructor() {
    this.interactedAudios = new Map();
  }

  private onInteractionOver = (audio: HTMLElement) => this.interactedAudios.delete(audio);

  onAudioOver = () => {
    const moreButtons = hasAppeared(UI_ELEMENTS.moreButton);
    if (moreButtons === null) return;

    for (let i = 0; i < moreButtons.length; i++) {
      const relatedAudio = moreButtons[i].closest('.audio_row') as HTMLElement;

      if (!this.interactedAudios.has(relatedAudio)) {
        const interaction = new Interaction(relatedAudio, moreButtons[i], this.onInteractionOver);
        interaction.appearanceObserver = new MutationObserver(interaction.onActionsAppeared);
        interaction.disappearanceObserver = new MutationObserver(interaction.onActionsDisappeared);
        this.interactedAudios.set(relatedAudio, interaction);
      }
    }
  };

  run = () => {
    this.audioOverWatcher.observe(document.body, { subtree: true, childList: true });
  };
}

export default AudioInteractionWatcher;
