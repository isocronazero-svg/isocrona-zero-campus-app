export function createApiClient(config = {}) {
  return {
    config,
    async request() {
      return null;
    }
  };
}

export default createApiClient;
