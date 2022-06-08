
type Node = TreeNode;
type ParentNode = Node | null;
export type DataType = 'FILE_COLOR' | 'FILE_MEASURE' | 'FOLDER'
export interface Data {
  name: string;
  type: DataType
}
export interface TreeModelObserver {
  onAdd(parentNodeKey:  number, key: number, value: Data): void;
  onInit(key: number): void;
  onMove(parentNodeKey: number, key: number): void;
  // onUpdate(key: number, value: Data): void;
  onRemove(key: number): void;
}
class TreeNode {
  key: number;
  value: number;
  parent: TreeNode | null;
  children: Array<TreeNode>;

  constructor(key: number, value = key, parent: ParentNode = null) {
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

  constructor(client: TreeModelObserver, key : number) {
    this.root = new TreeNode(key);
    this.#client = client;
    this.#client.onInit(key);

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

  insert(parentNodeKey : number, key : number, value: any = key) {
    for (let node of this.preOrderTraversal()) {
      if (node.key === parentNodeKey) {
        node.children.push(new TreeNode(key, value, node));
        this.#client!.onAdd(parentNodeKey, key, value);
        return true;
      }
    }
    return false;
  }

  remove(key: number) {
    for (let node of this.preOrderTraversal()) {
      const filtered = node.children.filter((c: Node) => c.key !== key);
      if (filtered.length !== node.children.length) {
        node.children = filtered;
        this.#client!.onRemove(node.key);
        return true;
      }
    }
    return false;
  }

  find(key: number) {
    for (let node of this.preOrderTraversal()) {
      if (node.key === key) return node;
    }
    return undefined;
  }

  move(newParentKey: number, key: number) {
    const node = this.find(key);
    const parent = this.find(newParentKey);
    if (!node || !parent) { return false; }
    node.parent!.children = node.parent!.children.filter((c: Node) => c.key !== key);
    node.parent = parent;
    parent.children.push(node);
    this.#client?.onMove(parent.key, node.key);
    return true;
  }
}