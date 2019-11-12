export type MapFile = {
  name: string
  size?: number
  modifiedTime?: number
  mimeType?: string
  parent: string
}

export type FilesMap = Map<string, MapFile>

export class Files {
  private map: FilesMap;

  constructor(map?: FilesMap) {
    if (map) {
      this.map = map;
    } else {
      this.map = new Map();
    }
  }

  // O(N)
  private findRoot() {
    for (const [id, file] of this.map) {
      if (!file.parent) {
        return id;
      }
    }

    return undefined;
  }

  // O(N)
  private findChildren(...parentIds: string[]) {
    const children: string[] = [];

    for (const [id, file] of this.map) {
      if (parentIds.includes(file.parent)) {
        children.push(id);
      }
    }

    return children;
  }

  // O(N*depth) = O(N)
  public findDescendants(...parentIds: string[]) {
    const descendants: string[] = [];
    let parents = parentIds;

    while (parents.length > 0) {
      parents = this.findChildren(...parents);
      descendants.push(...parents);
    }

    return descendants;
  }

  // O(N*depth) = O(N)
  public delete(id: string) {
    this.map.delete(id);

    const children = this.findDescendants(id);
    for (const child of children) {
      this.map.delete(child);
    }
  }

  // O(N*depth) = O(N)
  public paths() {
    const paths = new Map<string, string>();

    const root = this.findRoot();
    paths.set(root, '');

    if (!root) {
      return undefined;
    }

    let parents: string[] = [root];

    while (parents.length > 0) {
      parents = this.findChildren(...parents);

      for (const parent of parents) {
        const file = this.map.get(parent);
        const path = paths.get(file.parent);
        paths.set(parent, `${path}/${file.name}`);
      }
    }

    paths.set(root, '/');
    return paths;
  }

  // O(1)
  public set(id: string, file: MapFile) {
    this.map.set(id, file);
  }

  // O(1)
  public get(id: string) {
    return this.map.get(id);
  }

  get size() {
    return this.map.size;
  }

  public clear() {
    this.map.clear();
  }
}
