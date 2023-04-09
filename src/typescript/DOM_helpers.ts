import downloadAudio from './downloadAudio';
import { AudioData } from './types';

const UI_ELEMENTS = {
  moreButton: 'audio_row__action audio_row__action_more _audio_row__action_more',
  actionList: 'eltt _audio_row__tt',
  actions: '_audio_row__more_actions audio_row__more_actions',
  downloadButton: 'audio_row__more_action audio_row__more_action_download',
  addToPlaylistButton: 'audio_row__more_action audio_row__more_action_add_to_playlist',
  playButton: 'blind_label _audio_row__play_btn',
};

function hasAppeared(classList: string, rootElement?: HTMLElement): HTMLElement[] | null {
  const elem = rootElement ?? document;
  const elements = elem.getElementsByClassName(classList);
  if (elements.length === 0) return null;

  return Array.from(elements) as HTMLElement[];
}

function createButtonElement(): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.classList.add(...UI_ELEMENTS.downloadButton.split(' '));
  btn.innerText = 'Скачать';
  return btn;
}

function insertButton(btn: HTMLButtonElement, actionList: HTMLElement) {
  const actions = actionList.getElementsByClassName(UI_ELEMENTS.actions)[0];
  const addToPlaylist = actions.getElementsByClassName(UI_ELEMENTS.addToPlaylistButton)[0];
  actions.insertBefore(btn, addToPlaylist);

  if (actionList.classList.contains('eltt_top')) {
    const top = parseInt(actionList.style.top);
    actionList.style.top = `${top - 32}px`;
  }
}

function createDownloadButton(audio: HTMLElement, actionList: HTMLElement) {
  const button = createButtonElement();
  const audioData: AudioData = JSON.parse(audio.getAttribute('data-audio') as string);

  button.addEventListener('click', () => downloadAudio(audioData));

  insertButton(button, actionList);
}

export { UI_ELEMENTS, hasAppeared, createDownloadButton };
