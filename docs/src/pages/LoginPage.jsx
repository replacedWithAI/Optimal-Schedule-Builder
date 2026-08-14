/**
 * The default first page of the app. Also shown when user isn't logged in
 * Makes the user sign into their Google account, which is used for OAuth
 */

import "./login_page.css";
import glogo from "../assets/glogo.png";

const API_URL = import.meta.env.VITE_API_URL;

export default function LoginPage() {
    const handleLogin = () => {
        window.location.href = `${API_URL}/auth/login`;
    };

    return (
        <div className="login-root">
            <div className="login-card">
                <h1 className="login-title">Schedule Calculator</h1>
                <button 
                    className="login-button" 
                    onClick={handleLogin} 
                    data-tooltip="Sign in with Google"
                >
                        <img className="logo" 
                        src="glogo" 
                        alt="Sign in with google" />
                </button>

                <p className="login-notice">
                    YorkU accounts only&nbsp;(@yorku.ca or @my.yorku.ca)
                </p>
            </div>
        </div>
    );
}

