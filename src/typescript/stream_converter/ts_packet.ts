export const PACKET_LENGTH = 188;
const AUDIO_PACKET_PID = 0x100;

const enum Masks {
  // Packet Header
  PH_syncByte = 0xff000000,
  PH_PUSI = 0x00400000, // Payload Unit Start Indicator
  PH_ID = 0x001fff00,
  PH_AFC = 0x00000030, // Adaptation Field Control

  // Packetized Elementary Stream
  PES_startPrefix = 0x00000100,

  // Audio Frame
  AF_syncWord = 0xfff0,
}

const enum SyncValues {
  TSPacket = 0x47,
  PESPacket = 0x1,
  AudioFrame = 0xfff,
}

const enum AdaptationField {
  OnlyPayload = 0x1,
  OnlyField = 0x2,
  Both = 0x3,
}

export class TSPacket {
  private packetView: DataView;

  private packetOffset: number;
  private header: number;

  constructor(segmentBuffer: ArrayBuffer, packetIdx: number) {
    this.packetView = new DataView(segmentBuffer, packetIdx * PACKET_LENGTH, PACKET_LENGTH);
    this.packetOffset = 0;
    this.header = this.packetView.getInt32(this.packetOffset);

    if (!this.isTSPacket()) throw new Error('Invalid packet!');
  }

  private isTSPacket = () => (this.header & Masks.PH_syncByte) >> 24 === SyncValues.TSPacket;

  private isAudioPacket = () => (this.header & Masks.PH_ID) >> 8 === AUDIO_PACKET_PID;

  private hasPUSI = () => (this.header & Masks.PH_PUSI) >> 22 === 1;

  private getAFcontrol = () => (this.header & Masks.PH_AFC) >> 4;

  private hasPESPacket = (PESHeader: number) =>
    (PESHeader & Masks.PES_startPrefix) >> 8 === SyncValues.PESPacket;

  private hasAudioFrame = (frameBeginning: number) =>
    (frameBeginning & Masks.AF_syncWord) >> 4 === SyncValues.AudioFrame;

  private skipAFcontrol = () => {
    const control = this.getAFcontrol();

    switch (control) {
      case AdaptationField.OnlyPayload:
        this.packetOffset += 4;
        break;

      case AdaptationField.OnlyField:
        this.packetOffset = -1;
        break;

      case AdaptationField.Both:
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
