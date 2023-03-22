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
  private interactedAudio: HTMLElement | null;
  private interactedActionList: HTMLElement | null;

  audioOverWatcher: MutationObserver;
  actionsAppearedWatcher: MutationObserver;
  actionsDisappearedWatcher: MutationObserver;

  constructor() {
    this.interactedActionList = null;
    this.interactedAudio = null;
  }

  private mouseEnterActionMore = () => {
    if (this.interactedActionList !== null) return;
    this.actionsAppearedWatcher.observe(document.body, {
      subtree: true,
      childList: true,
    });
    console.log('%cSTARTED OBSERVING FOR ACTIONS', 'color: green');
  };

  private audioMouseLeave = (e: MouseEvent) => {
    if (e.relatedTarget === this.interactedActionList) return;
    this.cleanup();
  };

  private moreButtonMouseLeave = () => {
    if (this.interactedActionList !== null) return;
    this.actionsAppearedWatcher.disconnect();
    console.log('%cSTOPPED OBSERVING FOR ACTIONS', 'color: red');
  };

  private actionListMouseEnter = () => {
    this.actionsDisappearedWatcher.disconnect();
  };

  private actionListMouseLeave = (e: MouseEvent) => {
    if ((this.interactedAudio as Element).contains(e.relatedTarget as Node)) return;
    this.actionsDisappearedWatcher.observe(this.interactedActionList as Node, {
      attributeFilter: ['style'],
    });
  };

  cleanup = () => {
    (this.interactedAudio as Element).removeEventListener('mouseleave', this.audioMouseLeave);
    this.interactedAudio = null;
    if (this.interactedActionList === null) return;
    this.interactedActionList.parentNode?.removeChild(this.interactedActionList);
    this.interactedActionList = null;
  };

  audioOver = () => {
    if (this.interactedActionList !== null) return;

    const actionMore = hasAppeared(
      'audio_row__action audio_row__action_more _audio_row__action_more'
    );
    if (actionMore === null) return;

    const relatedAudio = actionMore.closest('.audio_row') as HTMLElement;
    if (this.interactedAudio === relatedAudio) return;
    this.interactedAudio = relatedAudio;
    const attrib = JSON.parse(relatedAudio.getAttribute('data-audio') as string);

    actionMore.addEventListener('mouseenter', this.mouseEnterActionMore, {
      once: true,
    });
    actionMore.addEventListener('mouseleave', this.moreButtonMouseLeave);
    relatedAudio.addEventListener('mouseleave', this.audioMouseLeave);
    console.log('User is on ', attrib[4], ' - ', attrib[3]);
  };

  actionsAppeared = () => {
    const actionList = hasAppeared('eltt _audio_row__tt');
    if (actionList === null) return;

    this.interactedActionList = actionList;
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
const waitForAudioOver = new MutationObserver(Watcher.audioOver);
const waitForActionsOver = new MutationObserver(Watcher.actionsAppeared);
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
