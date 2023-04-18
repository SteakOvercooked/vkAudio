import { UI_Elements } from './interaction_types';

export function hasAppeared(element: UI_Elements, rootElement?: HTMLElement): HTMLElement[] | null {
  const elem = rootElement ?? document;
  const elements = elem.getElementsByClassName(element);
  if (elements.length === 0) return null;

  return Array.from(elements) as HTMLElement[];
}

export function createButtonElement(): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.classList.add(...UI_Elements.DownloadButton.split(' '));
  btn.innerText = 'Скачать';
  return btn;
}

export function insertButton(btn: HTMLButtonElement, actionList: HTMLElement) {
  const actions = actionList.getElementsByClassName(UI_Elements.Actions)[0];
  const addToPlaylist = actions.getElementsByClassName(UI_Elements.AddToPlaylistButton)[0];
  actions.insertBefore(btn, addToPlaylist);

  if (actionList.classList.contains('eltt_top')) {
    const top = parseInt(actionList.style.top);
    actionList.style.top = `${top - 32}px`;
  }
}
