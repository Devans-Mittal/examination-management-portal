import {
    createContext,
    useContext,
    useEffect,
    useState
} from "react";

import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        const loadUser = async () => {
            try {
                const response = await api.get("/auth/me");

                if (mounted && response.data.success) {
                    const currentUser = response.data.user ?? response.data.data?.user ?? response.data.data;
                    setUser(currentUser ?? null);
                }
            } catch {
                if (mounted) {
                    setUser(null);
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        loadUser();

        return () => {
            mounted = false;
        };
    }, []);

    const login = async (email, password) => {
        const response = await api.post("/auth/login", {
            email,
            password
        });

        const loggedInUser =
            response.data?.user;

        if (!loggedInUser?.role) {
            console.error("Unexpected login response:", response.data);
            throw new Error("The login response did not contain user details.");
        }

        setUser(loggedInUser);

        return loggedInUser;
    };

    const register = async (userData) => {
        return api.post("/auth/register", userData);
    };

    const logout = async () => {
        try {
            await api.post("/auth/logout");
        } finally {
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                register,
                logout
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used inside AuthProvider.");
    }

    return context;
}