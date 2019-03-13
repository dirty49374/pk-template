import { getAjv } from "./lazy";

export class Schema {
    private ajv: any;
    private validator: any;

    constructor(schema: any) {
        this.ajv = getAjv();
        this.validator = this.ajv.compile(schema);

    }

    validate(values: any): string | null {
        const valid = this.validator(values);
        if (!valid) {
            const error = this.ajv.errorsText(this.validator.errors, { dataVar: 'input' });
            return error;
        }
        return null;
    }
}
