/* eslint-disable @typescript-eslint/no-explicit-any */
import Ajv, { type JSONSchemaType, type ValidateFunction } from 'ajv';

const ajv = new Ajv.default({ allErrors: true });

ajv.addKeyword({
  keyword: 'isFunction',
  validate: (schema: JSONSchemaType<unknown>, data: unknown) => {
    if (!schema) return true;
    return typeof data === 'function';
  },
  errors: false,
});

ajv.addKeyword({
  keyword: 'isFunctionOrNull',
  validate: (schema: JSONSchemaType<unknown>, data: unknown) => {
    if (!schema) return true;
    return data == null || typeof data === 'function';
  },
  errors: false,
});

// singleton
class AjvCache {
  private cache = new WeakMap<JSONSchemaType<unknown>, ValidateFunction>();

  compile<T>(schema: JSONSchemaType<T>): ValidateFunction<T> {
    if (this.cache.has(schema as any)) {
      return this.cache.get(schema as any) as ValidateFunction<T>;
    }
    const validate = ajv.compile(schema);
    this.cache.set(schema as any, validate);
    return validate as ValidateFunction<T>;
  }
}

export const ajvCache = new AjvCache();
export default ajv;
