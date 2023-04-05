import { AudioData, SegmentsInfo } from './types';
import getM3U8Url from '../vk_source/getM3U8Url';
import { getStreamComponent, getTransformData } from './api_calls';
import { getSegmentsInfo } from './M3U8_parser';
import { convert } from './stream_converter';

const KEY_BYTE_LENGTH = 16;
const CRYPT_ALGO = 'AES-CBC';

function initDownload(audioBuffer: Int8Array, title: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([audioBuffer]));
  a.setAttribute('download', title + '.mp3');
  a.click();
}

async function getSegments(
  streamUrl: string,
  key: CryptoKey,
  segmentsInfo: SegmentsInfo
): Promise<ArrayBuffer[]> {
  const segments = await Promise.all<Promise<ArrayBuffer>>(
    segmentsInfo.map(async ({ isEncrypted, segIdx }) => {
      const segment = await getStreamComponent(streamUrl, 'segment', segIdx);

      if (isEncrypted) {
        const iv = getIV(segIdx);
        const decryptedSegment = await crypto.subtle.decrypt(
          { name: CRYPT_ALGO, iv: iv },
          key,
          segment
        );
        return decryptedSegment;
      }
      return segment;
    })
  );
  return segments;
}

async function getKey(streamUrl: string): Promise<CryptoKey> {
  const key_bytes = await getStreamComponent(streamUrl, 'decrypt_key');
  const key = await crypto.subtle.importKey('raw', key_bytes, CRYPT_ALGO, false, ['decrypt']);

  return key;
}

function getIV(segIdx: number): Int8Array {
  const iv = new Int8Array(KEY_BYTE_LENGTH);
  iv.set([segIdx], 15);

  return iv;
}

const getStreamUrl = (apiUnavailableUrl: string, vk_id: number): string => {
  const m3u8Url = getM3U8Url(apiUnavailableUrl, vk_id);
  const idx = m3u8Url.lastIndexOf('/');
  return m3u8Url.substring(0, idx + 1);
};

const getAudioID = (audioData: AudioData) => [audioData[1], audioData[0], audioData[24]].join('_');

function getAudioTitle(audioData: AudioData) {
  const titleEncoded = audioData[4] + ' - ' + audioData[3];
  const txt = document.createElement('textarea');
  txt.innerHTML = titleEncoded;
  return txt.value;
}

const downloadAudio = async (rawAudioData: string) => {
  const audioData: AudioData = JSON.parse(rawAudioData);
  const audioID = getAudioID(audioData);
  const { vk_id, apiUnavailableUrl } = await getTransformData(audioID);
  const streamUrl = getStreamUrl(apiUnavailableUrl, vk_id);

  const playlist = await getStreamComponent(streamUrl, 'playlist');
  const segmentsInfo = getSegmentsInfo(playlist);

  const key = await getKey(streamUrl);

  const segments = await getSegments(streamUrl, key, segmentsInfo);

  const audioBuffer = convert(segments);
  initDownload(audioBuffer, getAudioTitle(audioData));
};

export default downloadAudio;
