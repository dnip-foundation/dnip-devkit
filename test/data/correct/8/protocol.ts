export default () => ({
  mw: {
    jwt: () => {},
    headers: () => {},
    some: () => {},
  },
  domain: {
    some: {
      headers: { type: 'object', properties: {} },
      input: { type: 'object', properties: {} },
      output: { type: 'object', properties: {} },
      execute: () => {},
    }
  },
});
