import { Menu, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const roleLabels = {
    admin: "Administrator",
    examiner: "Examiner",
    student: "Student"
};

export default function Navbar({ onMenuClick }) {
    const { user, logout } = useAuth();

    const handleLogout = async () => {
        try {
            await logout();
        } finally {
            window.location.href = "/login";
        }
    };

    const initials = (user?.fullName || "User")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join("");

    return (
        <header className="topbar">
            <button
                className="menu-toggle"
                onClick={onMenuClick}
                aria-label="Open navigation"
            >
                <Menu size={22} />
            </button>

            <div className="topbar-heading">
                <span className="topbar-eyebrow">EXAMINATION MANAGEMENT</span>
                <span className="topbar-subtitle">
                    Your academic workspace
                </span>
            </div>

            <div className="topbar-user">
                <div className="topbar-user-info">
                    <strong>{user?.fullName || "User"}</strong>
                    <span>{roleLabels[user?.role] || "Account"}</span>
                </div>

                <div className="user-avatar">{initials}</div>

                <button
                    className="logout-button"
                    onClick={handleLogout}
                    title="Sign out"
                    aria-label="Sign out"
                >
                    <LogOut size={18} />
                </button>
            </div>
        </header>
    );
}