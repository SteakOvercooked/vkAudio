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

const hasAppeared = (classList: string): HTMLElement | null => {
  const element = document.getElementsByClassName(classList);
  if (element.length === 0) return null;

  return element[0] as HTMLElement;
};

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

    const moreButton = hasAppeared(
      'audio_row__action audio_row__action_more _audio_row__action_more'
    );
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
    const actionList = hasAppeared('eltt _audio_row__tt');
    if (actionList === null) return;

    this.currentActionList = actionList;
    console.log('%cACTION LIST APPEARED', 'color: yellow');
    actionList.addEventListener('mouseleave', this.actionListMouseLeave);
    actionList.addEventListener('mouseenter', this.actionListMouseEnter);
    this.actionsAppearedWatcher.disconnect();
    console.log('%cSTOPPED OBSERVING FOR ACTIONS', 'color: red');
  };

  run = () => {
    this.audioOverWatcher.observe(document.body, { subtree: true, childList: true });
  };
}

const Watcher = new AudioInteractionWatcher();
const waitForAudioOver = new MutationObserver(Watcher.onAudioOver);
const waitForActionsOver = new MutationObserver(Watcher.onActionsAppeared);
const waitForDeletion = new MutationObserver(Watcher.cleanup);

Watcher.audioOverWatcher = waitForAudioOver;
Watcher.actionsAppearedWatcher = waitForActionsOver;
Watcher.actionsDisappearedWatcher = waitForDeletion;

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
