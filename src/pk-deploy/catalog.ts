import { ISet, IResourceKey } from "../common";

export class ICatalog {

}
export class PkdCatalog {
    static parse(id: string, text: string): PkdCatalog {
        const set: ISet = {};
        text.split('\n')
            .filter((line: string) => line)
            .forEach(key => set[key.trim()] = true);

        return new PkdCatalog(id, set);
    }

    constructor(private id: string, private keys: ISet) {
    }

    getId() {
        return this.id;
    }

    getData(): string {
        return Object.keys(this.keys).sort().join('\n');
    }

    getKeys(): IResourceKey[] {
        const left: IResourceKey[] = [];
        for (const key in this.keys) {
            const [kind, apiGroup, name, namespace] = key.split('/');
            left.push({ kind, apiGroup, namespace, name });
        }
        return left;
    }

    subtract(other: PkdCatalog): IResourceKey[] {
        const left: IResourceKey[] = [];
        for (const key in this.keys) {
            if (!other.keys[key]) {
                const [kind, apiGroup, name, namespace] = key.split('/');
                left.push({ kind, apiGroup, namespace, name });
            }
        }
        return left;
    }
}