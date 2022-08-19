import createVirtualEnvironment from '@locker/near-membrane-dom'
import internalApi from './core'
import framework from './plugin.framework.js?raw'
import * as fileType from '../config/fileType.json'
import distortionMap from '@/api/distortionMap'

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

export const registerPlugin = (plugin: Plugin): void =>{
  registry.set(plugin.id, plugin);
}

export const getPlugin = (id: string): Plugin | undefined => registry.get(id)
export const getAllPlugins = () => registry.keys()

export const unregisterPlugin = (id: string): boolean => registry.delete(id)

export const initPlugin = (id: string, instanceId: string): void => {
  console.log('plugin init')
  const plugin = getPlugin(id)!
  if (!plugin) return
  const { code, ui } = plugin 
  if (!code || !ui) return

  // Plugin configuration
  
  // Instantiate a new plugin
  // Let's start by the plugin UI into a new template
  const template = document.createElement('template')
  // instanceId the id coming from the file
  template.setAttribute('id', `plugin-template-${instanceId}`)
  // Let's add the plugin html ui into the template
  template.innerHTML = ui
  // Let's add it to the (shadow) dom so it's available
  document.body.appendChild(template)

  const evaluateInNewSandbox = (sourceText: string) => {
    const env = createVirtualEnvironment(window, {
        distortionCallback(v) {
            return distortionMap.get(v) ?? v;
        },
    });
    // injecting instanceId into realm
    env.evaluate(`globalThis.instanceId = "${instanceId}"`)
    // injecting framework functionalities and exposed API into realm
    env.evaluate(framework)
    // finally evaluate the user code
    env.evaluate(sourceText);
  }

  // Run the Plugin code in a try/catch block. 
  // Error will be thrown but difficoult to debug
  // due to console limitations with Proxies
  // https://github.com/salesforce/near-membrane#debuggability
  try {
    evaluateInNewSandbox(code)
  } catch (error) {
    console.error(error)
  }
}
// Removes the instance of the plugin. 
export const removePlugin = (instanceId: string) => {
  document.getElementById(`plugin-template-${instanceId}`)!.remove();
}

// listening for pluginMessage from outer realm
// The plugin core API will dispatch a pluginMessage event that invoce a core function.
// the core functions are mapped in the internalApi map.
document.addEventListener('pluginMessage', (event) => {
  console.log('pluginMessage', event)
  const { funcName, funcValue, instanceId } =  (event as GeenesPluginEvent).detail
  const func = internalApi.get(funcName)
  const {name, val} = JSON.parse(funcValue)
  func!(instanceId, {name, value: val})
});