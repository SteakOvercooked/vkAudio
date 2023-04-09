import { PACKET_LENGTH } from './ts_packet';

export class ByteTransfer {
  private segment: DataView;
  private audio: DataView;

  private _bytesTransferred: number;

  constructor(audioBuffer: ArrayBuffer) {
    this.audio = new DataView(audioBuffer);
    this._bytesTransferred = 0;
  }

  setSegment = (segment: ArrayBuffer) => {
    this.segment = new DataView(segment);
  };

  bytesTransferred = () => this._bytesTransferred;

  transfer = (packetIdx: number, payloadStart: number) => {
    const transferLength = PACKET_LENGTH - payloadStart;
    const segByteOffset = packetIdx * PACKET_LENGTH + payloadStart;
    const octetsCount = Math.trunc(transferLength / 8);
    const bytesToNextOctet = transferLength % 8;

    for (let byte = segByteOffset; byte < segByteOffset + bytesToNextOctet; byte++) {
      this.audio.setInt8(this._bytesTransferred, this.segment.getInt8(byte));
      this._bytesTransferred++;
    }

    for (let octet = 0; octet < octetsCount; octet++) {
      this.audio.setFloat64(
        this._bytesTransferred,
        this.segment.getFloat64(segByteOffset + bytesToNextOctet + octet * 8)
      );
      this._bytesTransferred += 8;
    }
  };
}
