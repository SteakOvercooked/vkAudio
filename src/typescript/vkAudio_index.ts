/*
The way that this doesn't work:
1 - Override VK's functions that are exported on the window object to be able to react when a mouse is over the "more" button on a soundtrack.
2 - Create a handler (an above mentioned reaction) that finds the node to watch, starts watching it and when a child is inserted (contextual menu)
adds the "download" option.
3 - When a user clicks on "download", get audio data by calling AudioUtils.asObject() on audio-data attribute value of the primary div of a song. Extract
needed for the request data from there, then make a request to "https://vk.com/al_audio.php?act=reload_audio" passing concatenated values as ids parameter.
This gives us a link of form "https://vk.com/mp3/audio_api_unavailable.mp3?extra=..." that needs to be passed to a specific algorithm (found with blood and
sweat... and debugger). The result of the algorithm is a link of 2 types (not sure how to predict the type though) that are described below in the code. With that,
it is possible to trim a part of the link and replace "/index.m3u8" with ".mp3" getting a link to mp3 file as a result.
4 - Make a request to get the blob of an url, then construct an object url for the blob. Follow the blobURL to force the downloading of a file. 

NOT ALL AUDIOS CAN BE DOWNLOADED THIS WAY, SOME LINKS FAIL TO TRANSFORM
*/

const getRelatedAudio = (currentElement: HTMLElement): HTMLElement => {
  if (currentElement.classList.contains('audio_row')) return currentElement;
  return getRelatedAudio(currentElement.parentElement as HTMLElement);
};

const isInteracted = (classList: string): [boolean, HTMLElement | undefined] => {
  const element = document.getElementsByClassName(classList);
  if (element.length === 0) return [false, undefined];

  return [true, element[0] as HTMLElement];
};

class AudioInteractionWatcher {
  private interactedAudio: HTMLElement | undefined;
  private interactedActionList: HTMLElement | undefined;

  private audioOverWatcher: MutationObserver;
  private actionsOverWatcher: MutationObserver;
  private someWatcher: MutationObserver;

  constructor() {
    this.interactedActionList = undefined;
    this.interactedAudio = undefined;

    this.audioMouseLeave = this.audioMouseLeave.bind(this);
    this.mouseEnterActionMore = this.mouseEnterActionMore.bind(this);
    this.moreButtonMouseLeave = this.moreButtonMouseLeave.bind(this);
    this.actionListMouseLeave = this.actionListMouseLeave.bind(this);
    this.audioOver = this.audioOver.bind(this);
    this.actionsOver = this.actionsOver.bind(this);
    this.cleanup = this.cleanup.bind(this);
    this.somethingAction = this.somethingAction.bind(this);
    this.actionListMouseEnter = this.actionListMouseEnter.bind(this);
  }

  private cleanup() {
    (this.interactedAudio as Element).removeEventListener('mouseleave', this.audioMouseLeave);
  }

  private mouseEnterActionMore() {
    if (this.interactedActionList !== undefined) return;
    this.actionsOverWatcher.observe(document.body, {
      subtree: true,
      childList: true,
    });
    console.log('%cSTARTED OBSERVING FOR ACTIONS', 'color: green');
  }

  private audioMouseLeave(e: MouseEvent) {
    if (e.relatedTarget === this.interactedActionList) return;
    console.log('%cCURSOR MOVED NOT ON ACTIONS', 'color: cyan');
    this.cleanup();
    this.interactedAudio = undefined;
    if (this.interactedActionList === undefined) return;
    (this.interactedActionList.parentNode as Node).removeChild(this.interactedActionList);
    this.interactedActionList = undefined;
  }

  private moreButtonMouseLeave() {
    if (this.interactedActionList !== undefined) return;
    this.actionsOverWatcher.disconnect();
    console.log('%cSTOPPED OBSERVING FOR ACTIONS', 'color: red');
  }

  private actionListMouseEnter() {
    this.someWatcher.disconnect();
  }

  somethingAction() {
    this.cleanup();
    this.interactedAudio = undefined;
    // not quite right, need to wait in order to delete
    ((this.interactedActionList as Element).parentNode as Node).removeChild(
      this.interactedActionList as Element
    );
    this.interactedActionList = undefined;
  }

  private actionListMouseLeave(e: MouseEvent) {
    if ((this.interactedAudio as Element).contains(e.relatedTarget as Node)) return;
    // if (e.relatedTarget === this.interactedAudio) return;
    console.log('CURSOR MOVED NOT ON RELATED AUDIO');
    this.someWatcher.observe(this.interactedActionList as Node, { attributeFilter: ['style'] });
  }

  setAudioOverWatcher(watcher: MutationObserver) {
    this.audioOverWatcher = watcher;
  }

  setActionsOverWatcher(watcher: MutationObserver) {
    this.actionsOverWatcher = watcher;
  }

  setSomeWatcher(watcher: MutationObserver) {
    this.someWatcher = watcher;
  }

  audioOver() {
    if (this.interactedActionList !== undefined) return;

    const [isRowInteracted, actionMore] = isInteracted(
      'audio_row__action audio_row__action_more _audio_row__action_more'
    );
    if (!isRowInteracted) return;

    const relatedAudio = getRelatedAudio(actionMore as HTMLElement);
    if (this.interactedAudio === relatedAudio) return;
    this.interactedAudio = relatedAudio;
    const attrib = JSON.parse(relatedAudio.getAttribute('data-audio') as string);

    (actionMore as Element).addEventListener('mouseenter', this.mouseEnterActionMore, {
      once: true,
    });
    (actionMore as Element).addEventListener('mouseleave', this.moreButtonMouseLeave);
    relatedAudio.addEventListener('mouseleave', this.audioMouseLeave);
    console.log('User is on ', attrib[4], ' - ', attrib[3]);
  }

  actionsOver() {
    const [isButtonInteracted, actionList] = isInteracted('eltt _audio_row__tt');
    if (!isButtonInteracted) return;

    this.interactedActionList = actionList;
    console.log('ACTION LIST APPEARED ' + actionList);
    (actionList as HTMLElement).addEventListener('mouseleave', this.actionListMouseLeave);
    (actionList as HTMLElement).addEventListener('mouseenter', this.actionListMouseEnter);
    this.actionsOverWatcher.disconnect();
    console.log('%cSTOPPED OBSERVING FOR ACTIONS', 'color: red');
  }

  run() {
    this.audioOverWatcher.observe(document.body, { subtree: true, childList: true });
  }
}

const Watcher = new AudioInteractionWatcher();
const waitForAudioOver = new MutationObserver(Watcher.audioOver);
const waitForActionsOver = new MutationObserver(Watcher.actionsOver);
const waitForDeletion = new MutationObserver(Watcher.somethingAction);

Watcher.setAudioOverWatcher(waitForAudioOver);
Watcher.setActionsOverWatcher(waitForActionsOver);
Watcher.setSomeWatcher(waitForDeletion);

Watcher.run();

// since add_to_playlist is always there we can rely on it
// const refNode = audioMoreActions.querySelector(
//   'button.audio_row__more_action.audio_row__more_action_add_to_playlist'
// );
// if (!refNode) return;

// const downloadButton = createDownloadAction();
// if (!refNode.parentNode) return;

// const actionList = <HTMLDivElement>refNode.parentNode;
// actionList.insertBefore(downloadButton, refNode);

// // making sure that if the contextual menu appears above the audio element it is brought one button higher to avoid UI bug
// if (audioMoreActions.classList.contains('eltt_top')) {
//   let top = parseInt(audioMoreActions.style.top);
//   audioMoreActions.style.top = `${top - 32}px`;
// }
// observer.disconnect();
