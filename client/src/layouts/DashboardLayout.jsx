import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

export default function DashboardLayout() {
    const { user } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="dashboard-shell">
            <Sidebar
                role={user?.role}
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            <div className="dashboard-main">
                <Navbar onMenuClick={() => setSidebarOpen(true)} />

                <main className="dashboard-content">
                    <Outlet />
                </main>

                <footer className="dashboard-footer">
                    Examination Management Portal
                    <span>Academic assessment workspace</span>
                </footer>
            </div>
        </div>
    );
}