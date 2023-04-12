import { AudioData, SegmentsInfo } from './types';
import { AudioReceiver } from './api/audio_receiver';
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
  receiver: AudioReceiver,
  key: CryptoKey,
  segmentsInfo: SegmentsInfo,
  loadingBar: LoadingBar
): Promise<ArrayBuffer[]> {
  let progress = 30;
  const step = Math.trunc(50 / segmentsInfo.length);
  const requests = segmentsInfo.map(async ({ isEncrypted, mediaSequence }) => {
    let segment = await receiver.getStreamComponent('segment', mediaSequence);

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

  return await Promise.all(requests);
}

async function getKey(receiver: AudioReceiver): Promise<CryptoKey> {
  const key_bytes = await receiver.getStreamComponent('decrypt_key');
  const key = await crypto.subtle.importKey('raw', key_bytes, CRYPT_ALGO, false, ['decrypt']);

  return key;
}

function getIV(mediaSequence: number): Int8Array {
  const iv = new Int8Array(KEY_BYTE_LENGTH);
  iv.set([mediaSequence], 15);

  return iv;
}

const getAudioID = (audioData: AudioData) => [audioData[1], audioData[0], audioData[24]].join('_');

function getAudioTitle(audioData: AudioData) {
  const titleEncoded = audioData[4] + ' - ' + audioData[3];
  const txt = document.createElement('textarea');
  txt.innerHTML = titleEncoded;

  return txt.value;
}

async function downloadAudio(audio: HTMLElement) {
  const receiver = new AudioReceiver();
  const loadingBar = new LoadingBar(audio);
  const audioData: AudioData = JSON.parse(audio.getAttribute('data-audio') as string);

  const audioID = getAudioID(audioData);

  try {
    await receiver.fetchStreamUrl(audioID);
    loadingBar.setProgress(10);
  } catch (err) {
    loadingBar.throw();
    return;
  }

  let playlist: string;
  try {
    playlist = await receiver.getStreamComponent('playlist');
    loadingBar.setProgress(20);
  } catch (err) {
    loadingBar.throw();
    return;
  }

  let key: CryptoKey;
  try {
    key = await getKey(receiver);
    loadingBar.setProgress(30);
  } catch (err) {
    loadingBar.throw();
    return;
  }

  const segmentsInfo = getSegmentsInfo(playlist);

  let segments: ArrayBuffer[];
  try {
    segments = await getSegments(receiver, key, segmentsInfo, loadingBar);
  } catch (err) {
    loadingBar.throw();
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
