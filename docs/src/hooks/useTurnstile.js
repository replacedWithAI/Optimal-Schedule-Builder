import { useEffect, useRef, useCallback } from "react";

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;

export default function useTurnstile() {
    const containerRef = useRef(null);
    const widget = useRef(null);

    useEffect(() => {
        if (!window.turnstile || !containerRef.current) return;
        widget.current = window.turnstile.render(containerRef.current, {
            sitekey: SITE_KEY,
            size: "invisible",
        });
        return () => window.turnstile.remove(widget.current);
    }, []);

    const getToken = useCallback(() => {
        return new Promise((resolve, reject) => {
            if (!window.turnstile || widget.current === null) {
                reject(new Error("Turnstile not ready"));
                return;
            }
            window.turnstile.execute(widget.current, {
                callback: resolve,
                "error-callback": () => reject(new Error("Turnstile failed")),
            });
        });
    }, []);

    return { containerRef, getToken };
}