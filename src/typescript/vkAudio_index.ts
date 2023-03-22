import AudioInteractionWatcher from './audio_interaction';

const Watcher = new AudioInteractionWatcher();
const waitForAudioOver = new MutationObserver(Watcher.onAudioOver);
const waitForActionsOver = new MutationObserver(Watcher.onActionsAppeared);
const waitForDeletion = new MutationObserver(Watcher.cleanup);

Watcher.audioOverWatcher = waitForAudioOver;
Watcher.actionsAppearedWatcher = waitForActionsOver;
Watcher.actionsDisappearedWatcher = waitForDeletion;

Watcher.run();
