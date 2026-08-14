import { useState, useEffect } from "react";
import { AuthContext } from "./auth_context.jsx";
import { getAuthToken, setAuthToken, clearAuthToken, authHeader } from "../api/authToken.js";

const API_URL = import.meta.env.VITE_API_URL;

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

        const token = new URLSearchParams(window.location.hash.slice(1)).get("token");
        if (token) {
            setAuthToken(token);
            window.history.replaceState(
                null,
                "",
                `${window.location.pathname}${window.location.search}`
            );
        }

        const token = getAuthToken();
        if (!token) {
            setUser(null);
            setLoading(false);
            return;
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 1000*30);

        fetch(`${API_URL}/me`, {
            headers: authHeader(),
            signal: controller.signal
        })
            .then((result) => (result.ok ? result.json() : null))
            .then((data) => {
                if (!data) clearAuthToken();
                setUser(data);
                setLoading(false);
            })
            .catch(() => {
                setUser(null);
                setLoading(false);
            })
            .finally(() => clearTimeout(timeout));
    }, []);

    const logout = () => {
        clearAuthToken();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{user, loading, authError, logout}}>
            {children}
        </AuthContext.Provider>
    );
}
