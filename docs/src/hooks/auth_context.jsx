/**
 * provides user info (null if logged out)
 * When mounted, calls get_user_info in main.py to check whether cookie is valid
 */

import { createContext, use} from "react";

const AuthContext = createContext(null);

export default function useAuth() {
    return use(AuthContext);
}