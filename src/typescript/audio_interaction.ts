import downloadAudio from './downloadAudio';

import {
  hasAppeared,
  createDownloadButton,
  insertDownloadButton,
  UI_ELEMENTS,
} from './DOM_helpers';

class AudioInteractionWatcher {
  private currentAudio: HTMLElement | null;
  private currentActionList: HTMLElement | null;

  audioOverWatcher: MutationObserver;
  actionsAppearedWatcher: MutationObserver;
  actionsDisappearedWatcher: MutationObserver;

  constructor() {
    this.currentActionList = null;
    this.currentAudio = null;
  }

  private audioMouseLeave = (e: MouseEvent) => {
    if (e.relatedTarget === this.currentActionList) return;
    this.cleanup();
  };

  private moreButtonMouseEnter = () => {
    if (this.currentActionList !== null) return;
    this.actionsAppearedWatcher.observe(document.body, {
      subtree: true,
      childList: true,
    });
    console.log('%cSTARTED OBSERVING FOR ACTIONS', 'color: green');
  };

  private moreButtonMouseLeave = () => {
    if (this.currentActionList !== null) return;
    this.actionsAppearedWatcher.disconnect();
    console.log('%cSTOPPED OBSERVING FOR ACTIONS', 'color: red');
  };

  private actionListMouseEnter = () => {
    this.actionsDisappearedWatcher.disconnect();
  };

  private actionListMouseLeave = (e: MouseEvent) => {
    if ((this.currentAudio as HTMLElement).contains(e.relatedTarget as Node)) return;
    this.actionsDisappearedWatcher.observe(this.currentActionList as HTMLElement, {
      attributeFilter: ['style'],
    });
  };

  cleanup = () => {
    (this.currentAudio as HTMLElement).removeEventListener('mouseleave', this.audioMouseLeave);
    this.currentAudio = null;
    if (this.currentActionList === null) return;
    this.currentActionList.parentNode?.removeChild(this.currentActionList);
    this.currentActionList = null;
  };

  onAudioOver = () => {
    if (this.currentActionList !== null) return;

    const moreButton = hasAppeared(UI_ELEMENTS.moreButton);
    if (moreButton === null) return;

    const relatedAudio = moreButton.closest('.audio_row') as HTMLElement;
    if (this.currentAudio === relatedAudio) return;
    this.currentAudio = relatedAudio;
    const attrib = JSON.parse(relatedAudio.getAttribute('data-audio') as string);

    moreButton.addEventListener('mouseenter', this.moreButtonMouseEnter, {
      once: true,
    });
    moreButton.addEventListener('mouseleave', this.moreButtonMouseLeave);
    relatedAudio.addEventListener('mouseleave', this.audioMouseLeave);
    console.log('User is on ', attrib[4], ' - ', attrib[3]);
  };

  onActionsAppeared = () => {
    const actionList = hasAppeared(UI_ELEMENTS.actionList);
    if (actionList === null) return;

    this.currentActionList = actionList;
    console.log('%cACTION LIST APPEARED', 'color: yellow');

    const downloadButton = createDownloadButton();
    downloadButton.addEventListener('click', () => {
      downloadAudio(this.currentAudio?.getAttribute('data-audio') as string);
    });
    insertDownloadButton(downloadButton, actionList);

    actionList.addEventListener('mouseleave', this.actionListMouseLeave);
    actionList.addEventListener('mouseenter', this.actionListMouseEnter);

    this.actionsAppearedWatcher.disconnect();
    console.log('%cSTOPPED OBSERVING FOR ACTIONS', 'color: red');
  };

  run = () => {
    this.audioOverWatcher.observe(document.body, { subtree: true, childList: true });
  };
}

export default AudioInteractionWatcher;
