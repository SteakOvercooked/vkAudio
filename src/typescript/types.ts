interface ContentInfo {
  account_age_type: number;
  content_id: string;
  duration: number;
  puid22: number;
  ver: number;
  vk_id: number;
  _SITEID: number;
}

interface ArtistInfo {
  id: string;
  name: string;
}

export type AudioData = [
  contentID_1: number,
  contentID_2: number,
  api_unavailable_url: string,
  name: string,
  artist: string,
  duration: number,
  account_age_type: number,
  unknown: number,
  unknown: string,
  unknown: number,
  unknown: number,
  unknown: string,
  unknown: string,
  unknown: string,
  image_url: string,
  content_info: ContentInfo,
  unknown: string,
  artists_info: Array<ArtistInfo>,
  unknown: string,
  unknown: Array<[number, number, string]>,
  uknown: string,
  unknown: number,
  unknown: number,
  unknown: boolean,
  contentID_3: string,
  unknown: boolean,
  unknown: string,
  unknown: boolean
];

export interface ReloadAudiosResponse {
  langKeys: unknown;
  langVersion: string;
  loaderVersion: string;
  payload: [number, [[AudioData]]];
  statsMeta: unknown;
  templates: unknown;
}

export interface TransformData {
  vk_id: number;
  apiUnavailableUrl: string;
}

export type StreamComponent = 'playlist' | 'decrypt_key' | 'segment';

export type SegmentsInfo = { isEncrypted: boolean; mediaSequence: number }[];

export type onInteractionOver = (audio: HTMLElement) => void;

export const enum UI_Elements {
  MoreButton = 'audio_row__action audio_row__action_more _audio_row__action_more',
  ActionList = 'eltt _audio_row__tt',
  Actions = '_audio_row__more_actions audio_row__more_actions',
  DownloadButton = 'audio_row__more_action audio_row__more_action_download',
  AddToPlaylistButton = 'audio_row__more_action audio_row__more_action_add_to_playlist',
}

export type AsyncFunc = (...args: unknown[]) => Promise<unknown>;
