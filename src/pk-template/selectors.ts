type ObjectPredicate = (object: any) => boolean;

const buildPredicate = (src: string): ObjectPredicate => {
    const nv = src.split('=');

    if (nv.length > 1) {
        const lname = nv[0];
        const value = nv[1];
        if (lname[0] === '!') {
            const aname = lname.substring(1)
            return (object: any) =>
                object.metadata &&
                object.metadata.annotations &&
                (
                    value === '*'
                        ? aname in object.metadata.annotations
                        : object.metadata.annotations[aname] === value
                );
        }
        return (object: any) =>
            object.metadata &&
            object.metadata.labels &&
            (
                value === '*'
                    ? lname in object.metadata.labels
                    : object.metadata.labels[lname] === value
            );
    } else if (src[0] === '.') {
        const name = src.substr(1);
        return (object: any) =>
            object.metadata &&
            object.metadata.name == name;
    } else {
        return (object: any) => object.kind === src;
    }
};

const selectors = {
    compileOne: (src: string): ObjectPredicate => {
        const predicates = src.split(/\s+/).map(buildPredicate);
        return (object: any) => predicates.every(pred => pred(object));
    },
    compile: (src: string[] | string): ObjectPredicate => {
        if (typeof src === 'string') {
            src = [src];
        }
        const predicates = src.map(selectors.compileOne);
        return (object: any) => predicates.some(pred => pred(object));
    }
};

export default selectors;
