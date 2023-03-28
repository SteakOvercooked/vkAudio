import { AudioData, ReloadAudiosResponse, TransformData } from './types';
import getM3U8Url from '../vk_source/getM3U8Url';

const GET_AUDIO_DATA = 'al_audio.php?act=reload_audios';

const getStreamUrl = (apiUnavailableUrl: string, vk_id: number): string => {
  const m3u8Url = getM3U8Url(apiUnavailableUrl, vk_id);
  const idx = m3u8Url.lastIndexOf('/');
  return m3u8Url.substring(0, idx + 1);
};

const getContentData = async (audioID: string): Promise<TransformData | never> => {
  const fd = new FormData();
  fd.set('al', '1');
  fd.set('audio_ids', audioID);

  const response = await fetch(GET_AUDIO_DATA, {
    method: 'POST',
    body: fd,
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
};

const getAudioID = (rawAudioData: string): string => {
  const audioData: AudioData = JSON.parse(rawAudioData);
  return [audioData[1], audioData[0], audioData[24]].join('_');
};

const downloadAudio = async (rawAudioData: string) => {
  const audioID = getAudioID(rawAudioData);
  const { vk_id, apiUnavailableUrl } = await getContentData(audioID);
  const streamUrl = getStreamUrl(apiUnavailableUrl, vk_id);
  console.log(streamUrl);
};

export default downloadAudio;
