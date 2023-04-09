class InformativeMutationObserver {
  private observer: MutationObserver;
  private _isObserving: boolean;

  constructor(callback: MutationCallback) {
    this.observer = new MutationObserver(callback);
    this._isObserving = false;
  }

  isObserving = () => this._isObserving;

  observe = (target: Node, options?: MutationObserverInit) => {
    this.observer.observe(target, options);
    this._isObserving = true;
  };

  disconnect = () => {
    this.observer.disconnect();
    this._isObserving = false;
  };
}

export default InformativeMutationObserver;
