import Ajv, { type JSONSchemaType } from 'ajv';

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

export default ajv;
