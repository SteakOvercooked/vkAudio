import { AudioData, SegmentsInfo, TransformData } from './types';
import getM3U8Url from '../vk_source/getM3U8Url';
import { getStreamComponent, getTransformData } from './api_calls';
import { getSegmentsInfo } from './M3U8_parser';
import { convert } from './stream_converter/convert';
import LoadingBar from './loading_bar';

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
  segmentsInfo: SegmentsInfo,
  loadingBar: LoadingBar
): Promise<ArrayBuffer[]> {
  let progress = 30;
  const step = Math.trunc(50 / segmentsInfo.length);
  const requests = segmentsInfo.map(async ({ isEncrypted, mediaSequence }) => {
    let segment: ArrayBuffer;
    try {
      segment = await getStreamComponent(streamUrl, 'segment', mediaSequence);
    } catch (err) {
      loadingBar.throw();
      throw new Error(err);
    }

    if (isEncrypted) {
      segment = await crypto.subtle.decrypt(
        { name: CRYPT_ALGO, iv: getIV(mediaSequence) },
        key,
        segment
      );
    }
    progress += step;
    loadingBar.setProgress(progress);

    return segment;
  });

  const segments = await Promise.all<Promise<ArrayBuffer>>(requests);
  return segments;
}

async function getKey(streamUrl: string): Promise<CryptoKey> {
  let key_bytes: ArrayBuffer;
  try {
    key_bytes = await getStreamComponent(streamUrl, 'decrypt_key');
  } catch (err) {
    throw new Error(err);
  }

  const key = await crypto.subtle.importKey('raw', key_bytes, CRYPT_ALGO, false, ['decrypt']);
  return key;
}

function getIV(mediaSequence: number): Int8Array {
  const iv = new Int8Array(KEY_BYTE_LENGTH);
  iv.set([mediaSequence], 15);

  return iv;
}

function getStreamUrl(transformData: TransformData) {
  const { vk_id, apiUnavailableUrl } = transformData;
  const m3u8Url = getM3U8Url(apiUnavailableUrl, vk_id);
  const idx = m3u8Url.lastIndexOf('/');

  return m3u8Url.substring(0, idx + 1);
}

const getAudioID = (audioData: AudioData) => [audioData[1], audioData[0], audioData[24]].join('_');

function getAudioTitle(audioData: AudioData) {
  const titleEncoded = audioData[4] + ' - ' + audioData[3];
  const txt = document.createElement('textarea');
  txt.innerHTML = titleEncoded;

  return txt.value;
}

async function downloadAudio(audio: HTMLElement) {
  const audioData: AudioData = JSON.parse(audio.getAttribute('data-audio') as string);
  const loadingBar = new LoadingBar(audio);

  const audioID = getAudioID(audioData);

  let transformData: TransformData;
  try {
    transformData = await getTransformData(audioID);
    loadingBar.setProgress(10);
  } catch (err) {
    loadingBar.throw();
    return;
  }

  const streamUrl = getStreamUrl(transformData);

  let playlist: string;
  try {
    playlist = await getStreamComponent(streamUrl, 'playlist');
    loadingBar.setProgress(20);
  } catch (err) {
    loadingBar.throw();
    return;
  }

  const segmentsInfo = getSegmentsInfo(playlist);

  let key: CryptoKey;
  try {
    key = await getKey(streamUrl);
    loadingBar.setProgress(30);
  } catch (err) {
    loadingBar.throw();
    return;
  }

  let segments: ArrayBuffer[];
  try {
    segments = await getSegments(streamUrl, key, segmentsInfo, loadingBar);
  } catch (err) {
    return;
  }

  let audioBuffer: Int8Array;
  try {
    audioBuffer = convert(segments);
    loadingBar.setProgress(100);
  } catch (err) {
    loadingBar.throw();
    return;
  }

  initDownload(audioBuffer, getAudioTitle(audioData));
}

export default downloadAudio;
