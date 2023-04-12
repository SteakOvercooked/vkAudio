import { SegmentsInfo } from './types';

const enum Tag {
  CryptKey = '#EXT-X-KEY',
  SegInfo = '#EXTINF',
  EndList = '#EXT-X-ENDLIST',
}

function isEncrypted(cryptKeyTag: string) {
  const begin = cryptKeyTag.indexOf('METHOD');

  let end = cryptKeyTag.indexOf(',');
  if (end === -1) {
    end = cryptKeyTag.length;
  }

  const method = cryptKeyTag.substring(begin, end).split('=')[1];
  return method !== 'NONE';
}

function getMediaSequence(segmentName: string) {
  return parseInt(segmentName.split('-')[1]);
}

export function getSegmentsInfo(m3u8: string): SegmentsInfo {
  const m3u8Formatted = m3u8.split('\n');
  let encrypted = false;
  let line = 0;
  const segmentsInfo = [];

  do {
    if (m3u8Formatted[line].includes(Tag.CryptKey)) encrypted = isEncrypted(m3u8Formatted[line]);

    line++;

    if (m3u8Formatted[line].includes(Tag.SegInfo)) {
      segmentsInfo.push({
        isEncrypted: encrypted,
        mediaSequence: getMediaSequence(m3u8Formatted[line + 1]),
      });
      line++;
    }
  } while (!m3u8Formatted[line].includes(Tag.EndList));

  return segmentsInfo;
}
