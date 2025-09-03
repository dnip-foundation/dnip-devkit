export default () => ({
  domain: {
    cron: {
      some: {
        name: 'some',
        pattern: '*/15 * * * * *',
        execute: () => {},
      },
    },
  },
});
