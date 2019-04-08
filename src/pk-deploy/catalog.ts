import { ISet, IResourceKey } from "../common";

export class PkdCatalog {
  static parse(text: string): PkdCatalog {
    const set: ISet = {};
    text.split('\n')
      .filter((line: string) => line)
      .forEach(line => {
        const key = line.trim().split('/', 4).join('/');
        set[key] = true;
      });

    return new PkdCatalog(set);
  }

  constructor(private keys: ISet) {
  }

  getData(): string {
    return Object.keys(this.keys).sort().join('\n');
  }

  getKeys(): IResourceKey[] {
    const left: IResourceKey[] = [];
    for (const key in this.keys) {
      const [kind, apiGroup, name, namespace, sha] = key.split('/');
      left.push({ kind, apiGroup, namespace, name, sha });
    }
    return left;
  }

  subtract(other: PkdCatalog): IResourceKey[] {
    const left: IResourceKey[] = [];
    for (const key in this.keys) {
      if (!other.keys[key]) {
        const [kind, apiGroup, name, namespace, sha] = key.split('/');
        left.push({ kind, apiGroup, namespace, name, sha });
      }
    }
    return left;
  }
}
