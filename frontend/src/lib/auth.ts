export function saveToken(token: string) {
  localStorage.setItem("sawt_token", token);
}

export function getToken() {
  return localStorage.getItem("sawt_token");
}

export function removeToken() {
  localStorage.removeItem("sawt_token");
}