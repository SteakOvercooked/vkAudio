export type onInteractionOver = (audio: HTMLElement) => void;
export type onButtonCreated = (btn: HTMLButtonElement, audio: HTMLElement) => void;

export const enum UI_Elements {
  MoreButton = 'audio_row__action audio_row__action_more _audio_row__action_more',
  ActionList = 'eltt _audio_row__tt',
  Actions = '_audio_row__more_actions audio_row__more_actions',
  DownloadButton = 'audio_row__more_action audio_row__more_action_download',
  AddToPlaylistButton = 'audio_row__more_action audio_row__more_action_add_to_playlist',
}

export const ObserverConfig = {
  style: {
    attributeFilter: ['style'],
  },
  tree: {
    subtree: true,
    childList: true,
  },
};
