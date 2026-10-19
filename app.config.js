module.exports = ({ config }) => ({
  ...config,
  experiments: { ...config.experiments, ...(process.env.PAGES_BASE_PATH ? { baseUrl: process.env.PAGES_BASE_PATH } : {}) },
});
