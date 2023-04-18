export function initDownload(audioBuffer: Int8Array, title: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([audioBuffer]));
  a.setAttribute('download', title + '.mp3');
  a.click();
}

export function getIV(mediaSequence: number): Int8Array {
  const iv = new Int8Array(16); // 16-byte key (specified in the standard)
  iv.set([mediaSequence], 15);

  return iv;
}
