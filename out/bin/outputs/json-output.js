"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class JsonOutput {
    constructor(options) {
        this.options = options;
    }
    write(objects) {
        if (this.options.json) {
            if (this.options.indent) {
                console.log(JSON.stringify(objects, null, 4));
            }
            else {
                console.log(JSON.stringify(objects));
            }
        }
        else {
            if (this.options.indent) {
                return JSON.stringify(objects[0], null, 4);
            }
            else {
                return JSON.stringify(objects[0]);
            }
        }
    }
}
exports.JsonOutput = JsonOutput;
