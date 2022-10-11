import { registerPlugin, getAllPlugins } from '@/api/plugin'
const plugins = import.meta.glob('@/plugins/*/manifest.json',  { eager: true })
console.log(plugins)
interface Manifest {
  id: FileType,
  elementName: string,
  name: string
  description?: string
  author?: string
  code: string
  ui: string
}
const load = async () => {
  const modColor = await import('@/plugins/color/manifest.json');
  const uiColor = await import('@/plugins/color/ui.html?raw');
  const codeColor = await import('@/plugins/color/code.js?raw')
  registerPlugin({
    ...modColor as Manifest,
    code: codeColor.default,
    ui: uiColor.default,
  })
  const modDraw = await import('@/plugins/draw/manifest.json');
  const uiDraw = await import('@/plugins/draw/ui.html?raw');
  const codeDraw = await import('@/plugins/draw/code.js?raw')
  registerPlugin({
    ...modDraw as Manifest,
    code: codeDraw.default,
    ui: uiDraw.default,
  })
  // TODO understand how to bundle automatically these plugins
  // let keys = []

  // for (const key in plugins) {
  //   keys.push(key)
  // }
  // for await (const key of keys) {
  //   const mod = await plugins[key] as Manifest
  //   const { code: c, ui: u} = mod
  //   const uiPath = `${key.replace('manifest.json', '')}${u.replace('./', '')}?raw`
  //   const codePath = `${key.replace('manifest.json', '')}${c.replace('./', '')}?raw`
  //   const ui = await import(/* @vite-ignore */uiPath);
  //   const code = await import(/* @vite-ignore */codePath);
  //   registerPlugin({
  //     ...mod as Manifest,
  //     code: code.default,
  //     ui: ui.default,
  //   })
  // }
}

export default async (): Promise<IterableIterator<string>> => {
  await load()
  return getAllPlugins()
}