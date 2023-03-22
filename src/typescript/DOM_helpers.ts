const UI_ELEMENTS = {
  moreButton: 'audio_row__action audio_row__action_more _audio_row__action_more',
  actionList: 'eltt _audio_row__tt',
  actions: '_audio_row__more_actions audio_row__more_actions',
  downloadButton: 'audio_row__more_action audio_row__more_action_download',
  addToPlaylistButton: 'audio_row__more_action audio_row__more_action_add_to_playlist',
};

const hasAppeared = (classList: string): HTMLElement | null => {
  const element = document.getElementsByClassName(classList);
  if (element.length === 0) return null;

  return element[0] as HTMLElement;
};

const createDownloadButton = (): HTMLButtonElement => {
  const btn = document.createElement('button');
  btn.classList.add('audio_row__more_action', 'audio_row__more_action_download');
  btn.innerText = 'Скачать';
  // TODO:
  btn.addEventListener('click', () => {});
  return btn;
};

const insertDownloadButton = (btn: HTMLButtonElement, actionList: HTMLElement) => {
  const actions = document.getElementsByClassName(UI_ELEMENTS.actions)[0];
  const addToPlaylist = document.getElementsByClassName(UI_ELEMENTS.addToPlaylistButton)[0];
  actions.insertBefore(btn, addToPlaylist);

  if (actionList.classList.contains('eltt_top')) {
    const top = parseInt(actionList.style.top);
    actionList.style.top = `${top - 32}px`;
  }
};

export { UI_ELEMENTS, hasAppeared, createDownloadButton, insertDownloadButton };
