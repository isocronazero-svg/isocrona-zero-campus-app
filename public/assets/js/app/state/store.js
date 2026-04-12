export const state = {
  currentUser: null,
  role: "member",
  activeView: "overview"
};

export function getState() {
  return state;
}

export function setState(nextState = {}) {
  Object.assign(state, nextState);
  return state;
}

export default state;
