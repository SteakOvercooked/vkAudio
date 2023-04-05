const PACKET_LENGTH = 188;
const AUDIO_PACKET_PID = 0x100;

const AFValues = {
  AF_no_payload_yes: 0x1,
  AF_yes_payload_no: 0x2,
  AF_yes_payload_yes: 0x3,
};

const MASKS = {
  packetHeader: {
    syncByte: 0xff000000,
    PUSI: 0x00400000,
    ID: 0x001fff00,
    adaptationFieldControl: 0x00000030,
  },
  PESheader: {
    startPrefix: 0x00000100,
  },
  audioFrame: {
    syncWord: 0xfff0,
  },
};

const SYNC_VALUES = {
  TSpacket: 0x47,
  PESpacket: 0x1,
  audioFrame: 0xfff,
};

class ByteTransfer {
  private segView: DataView;
  private audioView: DataView;

  private bytesTransferred: number;

  constructor(audioBuffer: ArrayBuffer) {
    this.audioView = new DataView(audioBuffer);
    this.bytesTransferred = 0;
  }

  setSegment = (segment: ArrayBuffer) => {
    this.segView = new DataView(segment);
  };

  getBytesTransferred = () => this.bytesTransferred;

  transfer = (packetIdx: number, payloadStart: number) => {
    const transferLength = PACKET_LENGTH - payloadStart;
    const segByteOffset = packetIdx * PACKET_LENGTH + payloadStart;
    const octetsCount = Math.trunc(transferLength / 8);
    const bytesToNextOctet = transferLength % 8;

    for (let byteIdx = segByteOffset; byteIdx < segByteOffset + bytesToNextOctet; byteIdx++) {
      this.audioView.setInt8(this.bytesTransferred, this.segView.getInt8(byteIdx));
      this.bytesTransferred++;
    }

    for (let octetIdx = 0; octetIdx < octetsCount; octetIdx++) {
      this.audioView.setFloat64(
        this.bytesTransferred,
        this.segView.getFloat64(segByteOffset + bytesToNextOctet + octetIdx * 8)
      );
      this.bytesTransferred += 8;
    }
  };
}

class TSPacket {
  private packetView: DataView;

  private packetOffset: number;
  private header: number;

  constructor(segmentBuffer: ArrayBuffer, packetIdx: number) {
    this.packetView = new DataView(segmentBuffer, packetIdx * PACKET_LENGTH, PACKET_LENGTH);
    this.packetOffset = 0;
    this.header = this.packetView.getInt32(this.packetOffset);

    if (!this.isTSPacket()) throw new Error('Invalid packet!');
  }

  private isTSPacket = () =>
    (this.header & MASKS.packetHeader.syncByte) >> 24 === SYNC_VALUES.TSpacket;

  private isAudioPacket = () => (this.header & MASKS.packetHeader.ID) >> 8 === AUDIO_PACKET_PID;

  private hasPUSI = () => (this.header & MASKS.packetHeader.PUSI) >> 22 === 1;

  private getAFcontrol = () => (this.header & MASKS.packetHeader.adaptationFieldControl) >> 4;

  private hasPESPacket = (PESHeader: number) =>
    (PESHeader & MASKS.PESheader.startPrefix) >> 8 === SYNC_VALUES.PESpacket;

  private hasAudioFrame = (frameBeginning: number) =>
    (frameBeginning & MASKS.audioFrame.syncWord) >> 4 === SYNC_VALUES.audioFrame;

  private skipAFcontrol = () => {
    const control = this.getAFcontrol();

    switch (control) {
      case AFValues.AF_no_payload_yes:
        this.packetOffset += 4;
        break;

      case AFValues.AF_yes_payload_no:
        this.packetOffset = -1;
        break;

      case AFValues.AF_yes_payload_yes:
        this.packetOffset += 4;
        const AFLength = this.packetView.getInt8(this.packetOffset);
        this.packetOffset += AFLength + 1;
        break;
    }
  };

  /** Returns a number - byte index representing the beginning of payload*/
  payload = (): number => {
    if (!this.isAudioPacket()) return -1;

    this.skipAFcontrol();
    if (this.packetOffset === -1) return -1;

    if (!this.hasPUSI()) return this.packetOffset;

    // if a packet with mpeg frame has PUSI set on it also has got a PES header
    const PESHeader = this.packetView.getInt32(this.packetOffset);
    if (!this.hasPESPacket(PESHeader))
      throw new Error('Payload read error. Expected PES header start code');
    // PES header is 6 bytes +3 for optional header
    this.packetOffset += 8;

    const remainderLength = this.packetView.getInt8(this.packetOffset);
    this.packetOffset += remainderLength + 1;

    const frameBeginning = this.packetView.getInt16(this.packetOffset);
    if (!this.hasAudioFrame(frameBeginning))
      throw new Error('Payload read error. Expected mpeg frame syncword');

    return this.packetOffset;
  };
}

/** Returns an array where element at a given index is the index of the first
 * byte of the payload of the packet at the same index
 */
function readSegmentPayload(segment: ArrayBuffer): Array<number> {
  const packetCount = segment.byteLength / PACKET_LENGTH;
  const payloadMap = new Array(packetCount);
  let currentPacketIdx = 0;

  while (currentPacketIdx < packetCount) {
    const packet = new TSPacket(segment, currentPacketIdx);
    payloadMap[currentPacketIdx] = packet.payload();
    currentPacketIdx++;
  }

  return payloadMap;
}

export function convert(segments: (ArrayBuffer | null)[]): Int8Array {
  const bufferSize = segments.reduce(
    (size, buffer) => size + (buffer as ArrayBuffer).byteLength,
    0
  );
  const audioBuffer = new ArrayBuffer(bufferSize);
  const byteTransfer = new ByteTransfer(audioBuffer);
  let segIdx = 0;

  while (segIdx < segments.length) {
    const payloadMap = readSegmentPayload(segments[segIdx] as ArrayBuffer);

    byteTransfer.setSegment(segments[segIdx] as ArrayBuffer);
    for (let packetIdx = 0; packetIdx < payloadMap.length; packetIdx++)
      if (payloadMap[packetIdx] !== -1) byteTransfer.transfer(packetIdx, payloadMap[packetIdx]);

    segments[segIdx] = null;
    segIdx++;
  }

  return new Int8Array(audioBuffer, 0, byteTransfer.getBytesTransferred());
}
