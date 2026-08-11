import useAuth from "./hooks/auth_context.jsx";
import AuthProvider from "./hooks/AuthProvider.jsx";
import LoginPage from "./pages/login_page.jsx"; 
import MainPage from "./pages/MainPage.jsx";
import "./app.css";

export default function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
} 

function AppContent() {
    const {user, loading, authError, logout} = useAuth();

    if (loading) {
        return (
            <div className="text">
                Loading...
            </div>
        );
    }

    if (authError) {
        return (
            <div className="text auth-error-display">
                <p>{authError}</p>
                <button className="text re-authenticate-button">Retry</button>
            </div>
        )
    }

    if (!user) return <LoginPage />;
    
    return (<MainPage user={user} onLogout={logout} />);
}