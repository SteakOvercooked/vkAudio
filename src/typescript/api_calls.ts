import { ReloadAudiosResponse, TransformData, StreamComponent } from './types';

const GET_AUDIO_DATA = 'al_audio.php?act=reload_audios';
const REQUEST_EXPIRATION_TIME = 10000;

async function timedFetch(...args: Parameters<typeof fetch>): Promise<Response> {
  const controller = new AbortController();
  args[1] = Object.assign(args[1] ?? {}, { signal: controller.signal });

  const timeout = setTimeout(() => {
    controller.abort();
  }, REQUEST_EXPIRATION_TIME);

  try {
    const response = await fetch(...args);
    clearTimeout(timeout);

    if (response.ok) return response;

    throw new Error(response.statusText);
  } catch (err) {
    throw new Error(err);
  }
}

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
  try {
    const response = await timedFetch(streamUrl + componentMap.get(component));
    return component === 'playlist' ? response.text() : response.arrayBuffer();
  } catch (err) {
    throw new Error(err);
  }
}

export async function getTransformData(audioID: string): Promise<TransformData> {
  const requestBody = new FormData();
  requestBody.set('al', '1');
  requestBody.set('audio_ids', audioID);

  try {
    const response = await timedFetch(GET_AUDIO_DATA, {
      method: 'POST',
      body: requestBody,
      headers: {
        'x-requested-with': 'XMLHttpRequest',
      },
    });
    const result: ReloadAudiosResponse = await response.json();

    return {
      vk_id: result.payload[1][0][0][15].vk_id,
      apiUnavailableUrl: result.payload[1][0][0][2],
    };
  } catch (err) {
    throw new Error(err);
  }
}
