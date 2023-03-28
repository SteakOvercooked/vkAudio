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
