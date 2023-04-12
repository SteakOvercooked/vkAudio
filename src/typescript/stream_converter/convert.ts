import { TSPacket, PACKET_LENGTH } from './ts_packet';
import { ByteTransfer } from './byte_transfer';

/** Returns an array where indices correspond to packet indices in segment
 * and a value is the first byte of a packet's payload
 */
function readSegmentPayload(segment: ArrayBuffer): number[] {
  const packetCount = segment.byteLength / PACKET_LENGTH;
  const payloadMap = new Array(packetCount);
  let currentPacket = 0;

  while (currentPacket < packetCount) {
    try {
      const tsPacket = new TSPacket(segment, currentPacket);
      payloadMap[currentPacket] = tsPacket.payload();
    } catch (err) {
      throw new Error(err);
    }
    currentPacket++;
  }

  return payloadMap;
}

/** Transfers bytes from segment buffers to audio buffer */
export function convert(segments: (ArrayBuffer | null)[]): Int8Array {
  const bufferSize = segments.reduce(
    (size, buffer) => size + (buffer as ArrayBuffer).byteLength,
    0
  );
  const audioBuffer = new ArrayBuffer(bufferSize);
  const byteTransfer = new ByteTransfer(audioBuffer);
  let currentSegment = 0;

  while (currentSegment < segments.length) {
    let payloadMap: number[];
    try {
      payloadMap = readSegmentPayload(segments[currentSegment] as ArrayBuffer);
    } catch (err) {
      throw new Error(err);
    }

    byteTransfer.setSegment(segments[currentSegment] as ArrayBuffer);
    for (let packet = 0; packet < payloadMap.length; packet++)
      if (payloadMap[packet] !== -1) byteTransfer.transfer(packet, payloadMap[packet]);

    segments[currentSegment] = null;
    currentSegment++;
  }

  return new Int8Array(audioBuffer, 0, byteTransfer.bytesTransferred());
}
