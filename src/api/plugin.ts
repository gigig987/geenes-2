import createVirtualEnvironment from '@locker/near-membrane-dom'
import internalApi from './core'
import framework from './plugin.framework.js?raw'
import * as fileType from '../config/fileType.json';

declare global {
  type FileTypes = keyof typeof fileType;
}


interface Output {
  types: Array<FileTypes>
}

interface Plugin {
  id: FileTypes
  name: string
  description?: string
  author?: string
  code: string
  ui: string
  output?: Output
}

type GeenesPluginEvent = CustomEvent & {};

class PluginRegistry extends Map<string, Plugin> {}

const registry = new PluginRegistry();

export const register = (plugin: Plugin): void =>{
  registry.set(plugin.id, plugin);
}

export const getPlugin = (id: string): Plugin | undefined => registry.get(id)
export const getAllPlugins = () => registry.keys()

export const init = (id: string, instanceID: string): void => {
  console.log('plugin init')
  const plugin = getPlugin(id)!
  if (!plugin) return
  const { code, ui } = plugin 
  if (!code || !ui) return
  // This distortion maps will allow to filter out certain features that pose a security issue
  const { value } = Object.getOwnPropertyDescriptor(window, 'postMessage') as {value: Function};

  const distortionMap = new Map([
    [
      value,
        () => {
            console.error('forbidden');
            return null;
        },
    ],
  ]);
  // Plugin configuration
  // instanceID the id coming from the file

  // Instantiate a new plugin
  // Let's start by the plugin UI into a new iframe
  const iframe = document.createElement('iframe')
  // Let's hide it
  iframe.setAttribute('hidden', '')
  iframe.setAttribute('data-key', instanceID)
  // Let's add it to the dom so it's available
  document.body.appendChild(iframe)
  // Let's add the plugin html ui into the iframe
  iframe.contentDocument?.open()
  iframe.contentDocument?.write(`<template id="plugin-template">${ui}</template>`)
  console.log(iframe.contentDocument)
  iframe.contentDocument?.close()

  const myWin = iframe.contentWindow as Window & typeof globalThis
  // change the parent, self reference
  myWin.parent = myWin
  // Let's use the iframe window object to create a new realm
  const realm = createVirtualEnvironment(myWin, {
    distortionCallback(v) {
      return distortionMap.get(v as Function) ?? v;
    },
  });
  // listening for pluginMessage from outer realm
  // The plugin core API will dispatch a pluginMessage event that invoce a core function.
  // the core functions are mapped in the internalApi map.
  iframe.contentDocument!.addEventListener('pluginMessage', (event) => {
    const { funcName, funcValue } =  (event as GeenesPluginEvent).detail
    const func = internalApi.get(funcName)
    const {name, val} = JSON.parse(funcValue)
    func!(instanceID, {name, value: val})
  });
  // Inject framework code so the plugin can use the exposed API
  realm.evaluate(framework)

  // Run  the Plugin code
  try {
    realm.evaluate(code)
  } catch (error) {
    console.error(error)
  }
}


