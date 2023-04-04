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

  private bytesTransfered: number;

  constructor(audioBuffer: ArrayBuffer) {
    this.audioView = new DataView(audioBuffer);
    this.bytesTransfered = 0;
  }

  setSegment = (segment: ArrayBuffer) => {
    this.segView = new DataView(segment);
  };

  getBytesTransferred = () => this.bytesTransfered;

  transfer = (packetIdx: number, payloadStart: number) => {
    const transferLength = PACKET_LENGTH - payloadStart;
    const segByteOffset = packetIdx * PACKET_LENGTH + payloadStart;
    const octetsCount = Math.trunc(transferLength / 8);
    const bytesToNextOctet = transferLength % 8;

    for (let byteIdx = segByteOffset; byteIdx < segByteOffset + bytesToNextOctet; byteIdx++) {
      this.audioView.setInt8(this.bytesTransfered, this.segView.getInt8(byteIdx));
      this.bytesTransfered++;
    }

    for (let octetIdx = 0; octetIdx < octetsCount; octetIdx++) {
      this.audioView.setFloat64(
        this.bytesTransfered,
        this.segView.getFloat64(segByteOffset + bytesToNextOctet + octetIdx * 8)
      );
      this.bytesTransfered += 8;
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

export class StreamConverter {
  private segments: (ArrayBuffer | null)[];
  private audioBuffer: ArrayBuffer;
  private segView: DataView;
  private byteTransfer: ByteTransfer;

  private currentSegIdx: number;
  private currentPacketIdx: number;
  private segPacketCount: number;

  constructor(segments: ArrayBuffer[]) {
    this.segments = segments;
    this.currentSegIdx = 0;
    this.currentPacketIdx = 0;
    this.segPacketCount =
      (this.segments[this.currentSegIdx] as ArrayBuffer).byteLength / PACKET_LENGTH;
    this.segView = new DataView(segments[this.currentSegIdx]);

    const segmentsSize = segments.reduce((size, buffer) => size + buffer.byteLength, 0);
    this.audioBuffer = new ArrayBuffer(segmentsSize);
    this.byteTransfer = new ByteTransfer(this.audioBuffer);
  }

  private nextSegment = () => {
    this.segments[this.currentSegIdx] = null;
    this.currentSegIdx++;
    this.currentPacketIdx = 0;
    if (this.currentSegIdx === this.segments.length) return;
    this.segView = new DataView(this.segments[this.currentSegIdx] as ArrayBuffer);
    this.segPacketCount =
      (this.segments[this.currentSegIdx] as ArrayBuffer).byteLength / PACKET_LENGTH;
  };

  convert = (): Int8Array => {
    while (this.currentSegIdx < this.segments.length) {
      this.byteTransfer.setSegment(this.segView.buffer);

      while (this.currentPacketIdx < this.segPacketCount) {
        const packet = new TSPacket(this.segView.buffer, this.currentPacketIdx);
        const payloadStart = packet.payload();

        if (payloadStart !== -1) this.byteTransfer.transfer(this.currentPacketIdx, payloadStart);

        this.currentPacketIdx++;
      }

      this.nextSegment();
    }

    return new Int8Array(this.audioBuffer, 0, this.byteTransfer.getBytesTransferred());
  };
}
