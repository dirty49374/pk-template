import { getAjv } from "../lazy";

export class JsonSchema {
  private ajv: any;
  private validator: any;

  constructor(schema: any) {
    this.ajv = getAjv();
    this.validator = this.ajv.compile(schema);

  }

  validate(values: any): string | null {
    const valid = this.validator(values);
    if (!valid) {
      const error = this.ajv.errorsText(this.validator.errors, { dataVar: 'properties' });
      return error;
    }
    return null;
  }
}
