let authToken = null;

export function getAuthToken() {
    return authToken;
}

export function setAuthToken(token) {
    authToken = token;
}

export function clearAuthToken() {
    authToken = null;
}

export function authHeader() {
    const token = getAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
}
