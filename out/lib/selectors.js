"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const buildPredicate = (src) => {
    const nv = src.split('=');
    if (nv.length > 1) {
        const lname = nv[0];
        const value = nv[1];
        if (lname[0] === '!') {
            const aname = lname.substring(1);
            return (object) => object.metadata &&
                object.metadata.annotations &&
                (value === '*'
                    ? aname in object.metadata.annotations
                    : object.metadata.annotations[aname] === value);
        }
        return (object) => object.metadata &&
            object.metadata.labels &&
            (value === '*'
                ? lname in object.metadata.labels
                : object.metadata.labels[lname] === value);
    }
    else if (src[0] === '.') {
        const name = src.substr(1);
        return (object) => object.metadata &&
            object.metadata.name == name;
    }
    else {
        return (object) => object.kind === src;
    }
};
const selectors = {
    compileOne: (src) => {
        const predicates = src.split(/\s+/).map(buildPredicate);
        return (object) => predicates.every(pred => pred(object));
    },
    compile: (src) => {
        if (typeof src === 'string') {
            src = [src];
        }
        const predicates = src.map(selectors.compileOne);
        return (object) => predicates.some(pred => pred(object));
    }
};
exports.default = selectors;
