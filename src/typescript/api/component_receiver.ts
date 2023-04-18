import { ReloadAudiosResponse, TransformData, StreamComponent } from './api_types';
import getM3U8Url from '../../vk_source/getM3U8Url';
import { RequestGroup } from './request_group';

const GET_AUDIO_DATA = 'al_audio.php?act=reload_audios';

function getStreamUrl(transformData: TransformData) {
  const { vk_id, apiUnavailableUrl } = transformData;
  const m3u8Url = getM3U8Url(apiUnavailableUrl, vk_id);
  const idx = m3u8Url.lastIndexOf('/');

  return m3u8Url.substring(0, idx + 1);
}

export class ComponentReceiver {
  private requestGroup: RequestGroup;
  private audioID: string;
  private streamUrl: string | null;

  constructor(audioID: string) {
    this.streamUrl = null;
    this.audioID = audioID;
    this.requestGroup = new RequestGroup();
  }

  async fetchStreamUrl() {
    const requestBody = new FormData();
    requestBody.set('al', '1');
    requestBody.set('audio_ids', this.audioID);

    const response = await this.requestGroup.timedFetch(GET_AUDIO_DATA, {
      method: 'POST',
      body: requestBody,
      headers: {
        'x-requested-with': 'XMLHttpRequest',
      },
    });
    const result: ReloadAudiosResponse = await response.json();
    const transformData = {
      vk_id: result.payload[1][0][0][15].vk_id,
      apiUnavailableUrl: result.payload[1][0][0][2],
    };
    this.streamUrl = getStreamUrl(transformData);
  }

  async getStreamComponent(component: 'playlist'): Promise<string>;
  async getStreamComponent(component: 'decrypt_key'): Promise<ArrayBuffer>;
  async getStreamComponent(component: 'segment', mediaSequenсe: number): Promise<ArrayBuffer>;
  async getStreamComponent(
    component: StreamComponent,
    mediaSequence?: number
  ): Promise<ArrayBuffer | string> {
    if (this.streamUrl === null) throw new Error('Stream URL is not set!');

    const componentMap = new Map([
      ['playlist', 'index.m3u8'],
      ['decrypt_key', 'key.pub'],
      ['segment', `seg-${mediaSequence}-a1.ts`],
    ]);

    const response = await this.requestGroup.timedFetch(
      this.streamUrl + componentMap.get(component)
    );
    return component === 'playlist' ? response.text() : response.arrayBuffer();
  }
}
