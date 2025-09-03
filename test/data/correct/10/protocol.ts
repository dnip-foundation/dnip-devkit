export default () => ({
  mw: {
    some: () => {},
    headers: () => {},
    jwtBefore: () => {},
    someBefore: () => {},
    jwtAfter: () => {},
    someAfter: () => {},
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
