import {
  UI_Elements,
  onInteractionOver,
  onButtonCreated,
  ObserverConfig,
} from './interaction_types';
import InformativeMO from './informative_mutation_observer';
import { hasAppeared, createButtonElement, insertButton } from './interaction_utils';

export default class Interaction {
  private actionList: HTMLElement | null;
  private audio: HTMLElement;
  private moreButton: HTMLElement;
  private isOnAudio: boolean;

  private onOver: onInteractionOver;
  private onBtnCreated: onButtonCreated;

  appearanceObserver: MutationObserver;
  disappearanceObserver: InformativeMO;
  updateObserver: MutationObserver;

  constructor(
    audio: HTMLElement,
    moreButton: HTMLElement,
    onOver: onInteractionOver,
    onBtnCreated: onButtonCreated
  ) {
    this.actionList = null;
    this.isOnAudio = true;
    this.onOver = onOver;
    this.onBtnCreated = onBtnCreated;

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
    const actionLists = hasAppeared(UI_Elements.ActionList);
    if (actionLists === null) return;

    this.appearanceObserver.disconnect();

    this.actionList = actionLists[actionLists.length - 1];

    const button = createButtonElement();
    this.onBtnCreated(button, this.audio);
    insertButton(button, this.actionList);

    this.actionList.addEventListener('mouseleave', this.actionListMouseLeave);
    this.actionList.addEventListener('mouseenter', this.actionListMouseEnter);
  };

  onActionsDisappeared = () =>
    this.isOnAudio ? this.disappearanceObserver.disconnect() : this.cleanup();

  onMoreButtonUpdated = () => {
    const moreButtons = hasAppeared(UI_Elements.MoreButton, this.audio);
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
