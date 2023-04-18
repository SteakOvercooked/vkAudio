import { SegmentsInfo } from './loader_types';
import { ComponentReceiver } from '../api/component_receiver';
import { AudioData } from '../api/api_types';
import { getSegmentsInfo } from './M3U8_parser';
import { convert } from '../stream_converter/convert';
import { getIV, initDownload } from './loader_utils';
import { LoadProgressed, LoadFinished, LoadResult, Where } from './loader_types';

const CRYPT_ALGO = 'AES-CBC';

export class AudioLoader {
  private receiver: ComponentReceiver;
  private audioData: AudioData;
  private audio: HTMLElement;

  private onLoadProgressed: LoadProgressed;
  private onLoadFinished: LoadFinished;

  constructor(audio: HTMLElement, onLoadProgressed: LoadProgressed, onLoadFinished: LoadFinished) {
    this.audio = audio;
    this.audioData = JSON.parse(audio.getAttribute('data-audio') as string);
    this.receiver = new ComponentReceiver(this.getAudioID());

    this.onLoadProgressed = onLoadProgressed;
    this.onLoadFinished = onLoadFinished;
  }

  private getKey = async (): Promise<CryptoKey> => {
    const key_bytes = await this.receiver.getStreamComponent('decrypt_key');
    const key = crypto.subtle.importKey('raw', key_bytes, CRYPT_ALGO, false, ['decrypt']);

    return key;
  };

  private getSegments = (key: CryptoKey, segmentsInfo: SegmentsInfo): Promise<ArrayBuffer[]> => {
    let progress = 30; // transform data, playlist and key must be acquired
    const step = Math.trunc(50 / segmentsInfo.length);
    const requests = segmentsInfo.map(async ({ isEncrypted, mediaSequence }) => {
      let segment = await this.receiver.getStreamComponent('segment', mediaSequence);

      if (isEncrypted) {
        segment = await crypto.subtle.decrypt(
          { name: CRYPT_ALGO, iv: getIV(mediaSequence) },
          key,
          segment
        );
      }
      progress += step;
      this.onLoadProgressed(this.audio, progress);

      return segment;
    });

    return Promise.all(requests);
  };

  private getAudioID = () => [this.audioData[1], this.audioData[0], this.audioData[24]].join('_');

  private getAudioTitle = () => {
    const titleEncoded = this.audioData[4] + ' - ' + this.audioData[3];
    const txt = document.createElement('textarea');
    txt.innerHTML = titleEncoded;

    return txt.value;
  };

  download = async () => {
    try {
      await this.receiver.fetchStreamUrl();
      this.onLoadProgressed(this.audio, 10);
    } catch (err) {
      this.onLoadFinished(this.audio, LoadResult.Error, Where.StreamUrl);
      return;
    }

    let playlist: string;
    try {
      playlist = await this.receiver.getStreamComponent('playlist');
      this.onLoadProgressed(this.audio, 20);
    } catch (err) {
      this.onLoadFinished(this.audio, LoadResult.Error, Where.Playlist);
      return;
    }

    let key: CryptoKey;
    try {
      key = await this.getKey();
      this.onLoadProgressed(this.audio, 30);
    } catch (err) {
      this.onLoadFinished(this.audio, LoadResult.Error, Where.Key);
      return;
    }

    const segmentsInfo = getSegmentsInfo(playlist);

    let segments: ArrayBuffer[];
    try {
      segments = await this.getSegments(key, segmentsInfo);
    } catch (err) {
      this.onLoadFinished(this.audio, LoadResult.Error, Where.Segments);
      return;
    }

    let audioBuffer: Int8Array;
    try {
      audioBuffer = convert(segments);
      this.onLoadProgressed(this.audio, 100);
    } catch (err) {
      this.onLoadFinished(this.audio, LoadResult.Error, Where.Convertation);
      return;
    }

    initDownload(audioBuffer, this.getAudioTitle());
    this.onLoadFinished(this.audio, LoadResult.Success);
  };
}
