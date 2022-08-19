import { registerPlugin, getAllPlugins } from '@/api/plugin'
const plugins = import.meta.glob('@/plugins/*/manifest.json', { assert: {type: 'eager'}})

interface Manifest {
  id: FileTypes
  name: string
  description?: string
  author?: string
  code: string
  ui: string
}
const load = async () => {
  let keys = []
  for (const key in plugins) {
    keys.push(key)
  }
  for await (const key of keys) {
    const mod = await plugins[key]()
    const { code: c, ui: u} = mod
    const uiPath = `${key.replace('manifest.json', '')}${u.replace('./', '')}?raw`
    const codePath = `${key.replace('manifest.json', '')}${c.replace('./', '')}?raw`
    const ui = await import(/* @vite-ignore */uiPath);
    const code = await import(/* @vite-ignore */codePath);
    registerPlugin({
      ...mod as Manifest,
      code: code.default,
      ui: ui.default,
    })
  }
}

export default async (): Promise<IterableIterator<string>> => {
  await load()
  return getAllPlugins()
}