export default () => ({
  mw: {
    jwt: () => {},
    prepare: () => {},
    headers: () => {},
    apple: () => {},
    juice: () => {},
  },
  domain: {
    some1: {
      input: { type: 'object' },
      output: { type: 'object' },
      execute: () => {},
    },
    some2Input: { type: 'object' },
    some2Output: { type: 'object' },
    some2Execute: () => {},
    some3: {
      input: { type: 'object' },
      output: { type: 'object' },
      execute: () => {},
    },
    foo: {
      input: { type: 'object' },
      output: { type: 'object' },
      execute: () => {},
    },

    apple: {
      juice: {
        input: { type: 'object' },
        output: { type: 'object' },
        execute: () => {},
      },
      juiceCreate: {
        headers: { type: 'object' },
        input: { type: 'object' },
        output: { type: 'object' },
        execute: () => {},
      },
      juiceUpdate: {
        headers: { type: 'object' },
        input: { type: 'object' },
        output: { type: 'object' },
        execute: () => {},
      },
    },

    cron: {
      some1: () => {},
      some2: () => {},
    },
  },
});
