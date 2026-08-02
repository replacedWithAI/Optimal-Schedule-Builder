import useAuth from "./hooks/auth_context.jsx";
import AuthProvider from "./hooks/AuthProvider.jsx";
import login_page from "./pages/login_page.jsx"; 
import FetchSchedule from "./components/timetable.jsx";
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

    if (!user) return <login_page />;
    
    return (
        <div>
            <header className="top-menu">
                <span>{user.email}</span>
                <button className="signout_button">Sign out</button>
            </header>
            <FetchSchedule />
        </div>
    );
}