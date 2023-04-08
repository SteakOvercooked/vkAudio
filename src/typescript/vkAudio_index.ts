import AudioInteractionWatcher from './audio_interaction';

const Watcher = new AudioInteractionWatcher();
const waitForAudioOver = new MutationObserver(Watcher.onAudioOver);

Watcher.audioOverWatcher = waitForAudioOver;

Watcher.run();
