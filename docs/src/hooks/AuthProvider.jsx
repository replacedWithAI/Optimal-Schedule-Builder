import { useState, useEffect } from "react";
import AuthContext from "./auth_context.jsx";

const API_URL = import.meta.env.VITEAZUREURL;

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

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 1000*30);


        fetch(`${API_URL}/me`, {
            credentials: "include"
        })
            .then((result) => (res.ok ? res.json() : null))
            .then((data) => {
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
        await fetch(`${API_URL}/auth/logout`, {
            method: "POST",
            crednetials: "include"
        });
        setUser(null);
    }

    return (
        <AuthProvider value={{user, loading, authError, logout}}>
            {children}
        </AuthProvider>
    );
}