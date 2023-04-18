import InteractionManager from './interaction/interaction_manager';

const interactionManager = new InteractionManager();
interactionManager.audioOverWatcher = new MutationObserver(interactionManager.onAudioOver);
interactionManager.run();
