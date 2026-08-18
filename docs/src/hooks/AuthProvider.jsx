import { useState, useEffect } from "react";
import { AuthContext } from "./auth_context.jsx";

const API_URL = import.meta.env.VITE_API_URL;
const TOKEN_KEY = "token_key";

/**
 * Used to wrap App.jsx in main.jsx, such that all components are authenticated
 */
export default function AuthProvider({children}) {
    const [user, setUser] = useState(undefined);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState(null);

    useEffect(() => {
        if (!API_URL) {
            console.error("API_URL is not set in .env");
            setAuthError("Cloud URL not set");
            setLoading(false);
            return;
        }

        const hash = window.location.hash;
        if (hash.startsWith("#token=")) {
            sessionStorage.setItem(TOKEN_KEY, hash.slice("#token=".length));
            window.history.replaceState(
                null,
                "",
                `${window.location.pathname}${window.location.search}`
            );
        }

        const tokenKey = sessionStorage.getItem(TOKEN_KEY);
        if (!tokenKey) {
            setUser(null);
            setLoading(false);
            return;
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 1000*30);

        fetch(`${API_URL}/me`, {
            headers: { "Authorization": `Bearer ${tokenKey}` },
            signal: controller.signal
        })
            .then((result) => (result.ok ? result.json() : null))
            .then((data) => {
                if (!data) sessionStorage.removeItem(TOKEN_KEY);
                setUser(data);
                setLoading(false);
            })
            .catch(() => {
                setUser(null);
                setLoading(false);
            })
            .finally(() => clearTimeout(timeout));
    }, []);

    const logout = async () => {
        const token = sessionStorage.getItem(TOKEN_KEY);
        sessionStorage.removeItem(TOKEN_KEY);
        setUser(null);
        if (token) {
            await fetch(`${API_URL}/auth/logout`, {
                method: "POST",
                headers: {"Authorization": `Bearer ${token}`}
            }).catch(() => {});
        }
    };

    return (
        <AuthContext.Provider value={{user, loading, authError, logout}}>
            {children}
        </AuthContext.Provider>
    );
}
