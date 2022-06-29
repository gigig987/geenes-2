import { uuidv4 } from '@/utilities/utilities'

type Node = TreeNode;
type ParentNode = Node | null;
export type DataType = 'FILE_COLOR' | 'FILE_MEASURE' | 'FOLDER'
export interface Data {
  title: string;
  
  type: DataType
}
export type key = string | number;

export interface TreeModelObserver {
  onAdd(parentNodeKey:  key, key: key, value: Data): void;
  onInit(key: key): void;
  onMove(parentNodeKey: key, key: key): void;
  onUpdate(key: key, value: Data): void;
  onRemove(key: key): void;
}

interface ModelOptions {
  storageKey?: string;
  rootKey?: key
}

class TreeNode {
  key: key;
  value: any;
  parent: TreeNode | null;
  children: Array<TreeNode>;

  constructor(key: key, value = key, parent: ParentNode = null) {
    this.key = key;
    this.value = value;
    this.parent = parent;
    this.children = [];
  }

  get isLeaf() {
    return this.children.length === 0;
  }

  get hasChildren() {
    return !this.isLeaf;
  }
}

export default class Tree {
  root: TreeNode;
  #client: TreeModelObserver | null = null;
  #storageKey = '';

  constructor(client: TreeModelObserver, options?: ModelOptions) {
    this.#storageKey = options?.storageKey || 'project-structure';
    this.#client = client;
    const asJson = localStorage.getItem(this.#storageKey);
    let rootKey = options?.rootKey || uuidv4();
    this.root = new TreeNode(rootKey);
    if (asJson) {
      JSON.parse(asJson).structure
      .forEach(({ parent, key, value } : { parent:key, key:key, value: Data}) => {
        if (!parent) {
          rootKey = key;
          this.root = new TreeNode(rootKey);
          this.#client!.onInit(rootKey);
        } else {
          this.insert(parent, key, value)
        }
      });
    } else {
      this.#client!.onInit(rootKey);
    }
  }

  *preOrderTraversal(node = this.root): Generator<TreeNode> {
    yield node;
    if (node.children.length) {
      for (let child of node.children) {
        yield* this.preOrderTraversal(child);
      }
    }
  }

  *postOrderTraversal(node = this.root): Generator<TreeNode> {
    if (node.children.length) {
      for (let child of node.children) {
        yield* this.postOrderTraversal(child);
      }
    }
    yield node;
  }

  #save() {
    const array = [] ;
    for (let node of this.preOrderTraversal()) {
      array.push({
        parent: node.parent?.key,
        key: node.key,
        value: node.value,
        children: node.children.map(child => child.key)
      });
    }
    localStorage.setItem(this.#storageKey, JSON.stringify({structure: array}));
  }

  insert(parentNodeKey : key , key : key, value: any = key) {
    console.log(parentNodeKey, key);
    for (let node of this.preOrderTraversal()) {
      if (node.key === parentNodeKey) {
        node.children.push(new TreeNode(key, value, node));
        this.#save();
        this.#client!.onAdd(parentNodeKey, key, value);
        return true;
      }
    }
    return false;
  }

  remove(key: key) {
    for (let node of this.preOrderTraversal()) {
      const filtered = node.children.filter((c: Node) => c.key !== key);
      if (filtered.length !== node.children.length) {
        node.children = filtered;
        this.#save();
        this.#client!.onRemove(key);
        return true;
      }
    }
    return false;
  }

  find(key: key) {
    for (let node of this.preOrderTraversal()) {
      if (node.key == key) return node;
    }
    return undefined;
  }

  move(newParentKey: key, key: key) {
    const node = this.find(key);
    const parent = this.find(newParentKey);
    if (!node || !parent) { return false; }
    node.parent!.children = node.parent!.children.filter((c: Node) => c.key != key);
    node.parent = parent;
    parent.children.push(node);
    this.#save();
    this.#client?.onMove(parent.key, node.key);
    return true;
  }

  update(key:key, update : Partial<Data>) {
    const node = this.find(key);
    if (!node) { return false; }

    node.value = {...node.value , ...update};
    this.#save();
    this.#client?.onUpdate(key, node.value);
    return true;
  }
}