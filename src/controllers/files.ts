import Tree from '@/models/tree'
import { Data, key } from '@/models/tree'

import { initPlugin, removePlugin } from '@/api/plugin'

let fileCtrl : Tree | undefined = undefined

export const loadFiles = () => {
    // Tree data structure
    fileCtrl = new Tree(new class {
      onInit(_key: number): void{
      }
  
      onAdd(_parentKey: key, key: key, { type } : Data) {
        initPlugin(type, key as string)
      }
  
      onRemove(key: key) {
        removePlugin(key as string)
      }
    });
}

export const getFileCtrl = () => fileCtrl