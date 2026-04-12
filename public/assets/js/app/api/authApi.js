import { createApiClient } from "./client.js";

export function createAuthApi(client = createApiClient()) {
  return {
    client,
    async login() {
      return null;
    },
    async logout() {
      return null;
    },
    async refreshSession() {
      return null;
    }
  };
}

export default createAuthApi;
