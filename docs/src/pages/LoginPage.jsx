/**
 * The default first page of the app. Also shown when user isn't logged in
 * Makes the user sign into their Google account, which is used for OAuth
 */

import "./login_page.css";
import GoogleSignInButton from "../components/main/GoogleSignInButton.jsx";

const API_URL = import.meta.env.VITE_API_URL;
const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;

export default function LoginPage() {
    const widget = useRef(null);
    const [token, setToken] = useState(null);

    useEffect(() => {
        if (!window.turnstile || !widget.current) return;
        const widgetId = window.turnstile.render(widget.current, {
            sitekey: SITE_KEY,
            callback: setToken,
            "expired-callback": () => setToken(null),
        });
        return () => window.turnstile.remove(widgetId);
    }, []);

    const handleLogin = () => {
        const loginURL = new URL(`${API_URL}/auth/login`);
        loginURL.searchParams.set("cf_turnstile_token", token);
        window.location.href = loginURL.toString();
    };

    return (
        <div className="login-root">
            <div className="login-card">
                <h1 className="login-title">Schedule Calculator</h1>

                <div ref={widget} />

                <GoogleSignInButton onClick={handleLogin} disabled={!token}/>
                <p className="login-notice">Sign in with Google</p>

                <p className="login-notice">
                    YorkU accounts only&nbsp;(@yorku.ca or @my.yorku.ca)
                </p>
            </div>
        </div>
    );
}

