export function saveToken(token: string) {
  localStorage.setItem("sawt_token", token);
}

export function getToken() {
  return localStorage.getItem("sawt_token");
}

export function removeToken() {
  localStorage.removeItem("sawt_token");
}

// Parent session used while practicing as a child.
export function saveParentToken(token: string) {
  localStorage.setItem("sawt_parent_token", token);
}

export function getParentToken() {
  return localStorage.getItem("sawt_parent_token");
}

export function removeParentToken() {
  localStorage.removeItem("sawt_parent_token");
}

// Restore the parent session after leaving child practice mode.
export function restoreParentSession() {
  const parentToken = getParentToken();

  if (!parentToken) {
    return false;
  }

  saveToken(parentToken);
  removeParentToken();

  return true;
}

