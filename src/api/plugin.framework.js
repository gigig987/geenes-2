// Plugin framework
// This code is created by the core Geenes team and exposes certain APIs in a geenes function object
// dispatch is not exposed so calling it from a code into a realm will trow an error

'use strict';
class GeenesPluginEvent extends CustomEvent {};
const dispatch = ({funcName, funcValue}) => {
  const ev = new GeenesPluginEvent('pluginMessage', { detail: { funcName, funcValue, instanceId } });
  document.dispatchEvent(ev);
}

const setToken = (name, val) => {
  const funcName = 'setToken';
  const funcValue = JSON.stringify({name, val});
  dispatch({funcName, funcValue});
};

const removeToken = () => {
  const funcName = 'removeToken';
  dispatch({funcName});
};

const setColorToken = (name, val) => {
  const funcName = 'setColorToken';
  const funcValue = JSON.stringify({name, val});
  dispatch({funcName, funcValue});
};

globalThis.geenes = () => {
  return {
    setToken,
    removeToken,
    setColorToken
  }
};

