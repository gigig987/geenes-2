export type Mode = 'files' | 'team' | 'comments'

export interface ModelOptions {
  storageKey?: string;
}

export interface ModeModelObserver {
  onChange(value: Mode, oldValue: Mode): void;
}
export default class ModeModel {
  #client: ModeModelObserver | null = null;
  #storageKey = '';
  #currentMode : Mode = 'files';

  constructor(client: ModeModelObserver, options: ModelOptions = {}) {
    this.#storageKey = options.storageKey || 'mode';
    this.#client = client;
    const asJson = localStorage.getItem(this.#storageKey);
    asJson ? this.changeMode(asJson) : this.changeMode(this.#currentMode)
  }

  #validate(mode: Mode | string): Mode {
    return mode ? mode as Mode : 'files' as Mode;
  }

  #save() {
    localStorage.setItem(this.#storageKey, this.#currentMode);
  }

  getMode() {
    return this.#currentMode;
  }

  changeMode(mode: Mode | string): void {
    const val = this.#validate(mode);
    this.#client?.onChange(val, this.#currentMode);
    this.#currentMode = val;
    this.#save();
  }

}