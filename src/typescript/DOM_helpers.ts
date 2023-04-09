import downloadAudio from './downloadAudio';
import { AudioData } from './types';

export const enum UI_Elements {
  MoreButton = 'audio_row__action audio_row__action_more _audio_row__action_more',
  ActionList = 'eltt _audio_row__tt',
  Actions = '_audio_row__more_actions audio_row__more_actions',
  DownloadButton = 'audio_row__more_action audio_row__more_action_download',
  AddToPlaylistButton = 'audio_row__more_action audio_row__more_action_add_to_playlist',
}

export function hasAppeared(element: UI_Elements, rootElement?: HTMLElement): HTMLElement[] | null {
  const elem = rootElement ?? document;
  const elements = elem.getElementsByClassName(element);
  if (elements.length === 0) return null;

  return Array.from(elements) as HTMLElement[];
}

function createButtonElement(): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.classList.add(...UI_Elements.DownloadButton.split(' '));
  btn.innerText = 'Скачать';
  return btn;
}

function insertButton(btn: HTMLButtonElement, actionList: HTMLElement) {
  const actions = actionList.getElementsByClassName(UI_Elements.Actions)[0];
  const addToPlaylist = actions.getElementsByClassName(UI_Elements.AddToPlaylistButton)[0];
  actions.insertBefore(btn, addToPlaylist);

  if (actionList.classList.contains('eltt_top')) {
    const top = parseInt(actionList.style.top);
    actionList.style.top = `${top - 32}px`;
  }
}

export function createDownloadButton(audio: HTMLElement, actionList: HTMLElement) {
  const button = createButtonElement();
  const audioData: AudioData = JSON.parse(audio.getAttribute('data-audio') as string);

  button.addEventListener('click', () => downloadAudio(audioData));

  insertButton(button, actionList);
}
