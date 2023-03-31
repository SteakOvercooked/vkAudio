import { ReloadAudiosResponse, TransformData, StreamComponent } from './types';

const GET_AUDIO_DATA = 'al_audio.php?act=reload_audios';

export async function getStreamComponent(streamUrl: string, component: 'playlist'): Promise<string>;
export async function getStreamComponent(
  streamUrl: string,
  component: 'decrypt_key'
): Promise<ArrayBuffer>;
export async function getStreamComponent(
  streamUrl: string,
  component: 'segment',
  seg_idx: number
): Promise<ArrayBuffer>;

export async function getStreamComponent(
  streamUrl: string,
  component: StreamComponent,
  seg_idx?: number
): Promise<ArrayBuffer | string> {
  const componentMap = new Map([
    ['playlist', 'index.m3u8'],
    ['decrypt_key', 'key.pub'],
    ['segment', `seg-${seg_idx}-a1.ts`],
  ]);
  const response = await fetch(streamUrl + componentMap.get(component));

  if (response.ok) {
    if (component === 'playlist') return response.text();
    return response.arrayBuffer();
  }

  throw new Error(response.statusText);
}

export async function getTransformData(audioID: string): Promise<TransformData> {
  const requestBody = new FormData();
  requestBody.set('al', '1');
  requestBody.set('audio_ids', audioID);

  const response = await fetch(GET_AUDIO_DATA, {
    method: 'POST',
    body: requestBody,
    headers: {
      'x-requested-with': 'XMLHttpRequest',
    },
  });

  if (response.ok) {
    const result: ReloadAudiosResponse = await response.json();
    return {
      vk_id: result.payload[1][0][0][15].vk_id,
      apiUnavailableUrl: result.payload[1][0][0][2],
    };
  }

  throw new Error(response.statusText);
}
