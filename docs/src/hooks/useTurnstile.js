import { useEffect, useRef, useCallback } from "react";

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;

export default function useTurnstile() {
    const containerRef = useRef(null);
    const widget = useRef(null);
    const pending = useRef(null);

    useEffect(() => {
        if (!window.turnstile || !containerRef.current) return;
        widget.current = window.turnstile.render(containerRef.current, {
            sitekey: SITE_KEY,
            execution: "execute",
            callback: (token) => {
                pending.current?.resolve(token);
                pending.current = null;
            },
            "error-callback": () => {
                pending.current?.reject(new Error("Turnstile failed"));
                pending.current = null;
            }
        });
        return () => {
            if (widget.current !== null) window.turnstile.remove(widget.current);
        }
    }, []);

    const getToken = useCallback(() => {
        return new Promise((resolve, reject) => {
            if (!window.turnstile || containerRef.current === null) {
                reject(new Error("Turnstile not ready"));
                return;
            }
            pending.current = {resolve, reject};

            const timeout = setTimeout(() => {
                if (pending.current) {
                    pending.current = null;
                    reject(new Error("Verification timed out. Check your browser's" 
                                    +"privacy settings."));
                }
            }, 10000);

            const wrap = (fn) => (arg) => {clearTimeout(timeout); fn(arg)};
            pending.current = {resolve: wrap(resolve), reject: wrap(reject) };
            
            window.turnstile.reset(widget.current);
            window.turnstile.execute(widget.current);
        });
    }, []);

    return { containerRef, getToken };
}