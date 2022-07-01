declare global {
  interface Window {
    subscribers: Array<any>;
  }
}

interface State { [key: string | symbol]: any }

window.subscribers = [];

const defaultState: State = {
  fps: 0
};

export const state = new Proxy(defaultState, {
  set(state, key, value) {
    const oldState = { ...state };

    state[key] = value;

    window.subscribers.forEach(callback => callback(state, oldState));

    return !!state;
  }
});