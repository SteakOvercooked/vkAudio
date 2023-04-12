import { ReloadAudiosResponse, TransformData, StreamComponent } from '../types';
import { timedFetch, TimedResponse } from './api_utils';

const GET_AUDIO_DATA = 'al_audio.php?act=reload_audios';

export async function getStreamComponent(streamUrl: string, component: 'playlist'): Promise<string>;
export async function getStreamComponent(
  streamUrl: string,
  component: 'decrypt_key'
): Promise<ArrayBuffer>;
export async function getStreamComponent(
  streamUrl: string,
  component: 'segment',
  mediaSequence: number
): Promise<ArrayBuffer>;

export async function getStreamComponent(
  streamUrl: string,
  component: StreamComponent,
  mediaSequence?: number
): Promise<ArrayBuffer | string> {
  const componentMap = new Map([
    ['playlist', 'index.m3u8'],
    ['decrypt_key', 'key.pub'],
    ['segment', `seg-${mediaSequence}-a1.ts`],
  ]);

  let response: TimedResponse;
  try {
    response = new TimedResponse(...(await timedFetch(streamUrl + componentMap.get(component))));
  } catch (err) {
    throw err;
  }

  return component === 'playlist' ? response.text() : response.arrayBuffer();
}

export async function getTransformData(audioID: string): Promise<TransformData> {
  const requestBody = new FormData();
  requestBody.set('al', '1');
  requestBody.set('audio_ids', audioID);

  try {
    const response = new TimedResponse(
      ...(await timedFetch(GET_AUDIO_DATA, {
        method: 'POST',
        body: requestBody,
        headers: {
          'x-requested-with': 'XMLHttpRequest',
        },
      }))
    );
    const result: ReloadAudiosResponse = await response.json();

    return {
      vk_id: result.payload[1][0][0][15].vk_id,
      apiUnavailableUrl: result.payload[1][0][0][2],
    };
  } catch (err) {
    throw err;
  }
}
