import { NavLink } from "react-router-dom";
import {
    LayoutDashboard,
    BookOpen,
    ClipboardList,
    Users,
    CalendarDays,
    GraduationCap,
    FileCheck,
    CalendarCheck,
    X
} from "lucide-react";

const navigation = {
    admin: [
        { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
        { label: "Courses", path: "/admin/courses", icon: BookOpen },
        { label: "Examinations", path: "/admin/examinations", icon: ClipboardList },
        { label: "Examiners", path: "/admin/examiners", icon: Users },
        { label: "Results", path: "/admin/results", icon: FileCheck }
    ],
    examiner: [
        { label: "Dashboard", path: "/examiner", icon: LayoutDashboard },
        { label: "My Slots", path: "/examiner/slots", icon: CalendarDays },
        { label: "Evaluate Students", path: "/examiner/evaluate", icon: GraduationCap }
    ],
    student: [
        { label: "Dashboard", path: "/student", icon: LayoutDashboard },
        { label: "Available Exams", path: "/student/examinations", icon: BookOpen },
        { label: "My Bookings", path: "/student/bookings", icon: CalendarCheck },
        { label: "My Results", path: "/student/results", icon: FileCheck }
    ]
};

export default function Sidebar({ role, open, onClose }) {
    const links = navigation[role] || [];

    return (
        <>
            {open && (
                <button
                    className="sidebar-overlay"
                    onClick={onClose}
                    aria-label="Close navigation"
                />
            )}

            <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
                <div className="sidebar-brand">
                    <div className="brand-icon">E</div>
                    <div>
                        <h2>ExamPortal</h2>
                        <p>Examination Management</p>
                    </div>
                    <button
                        className="sidebar-close"
                        onClick={onClose}
                        aria-label="Close sidebar"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="sidebar-section-label">WORKSPACE</div>

                <nav className="sidebar-nav">
                    {links.map(({ label, path, icon: Icon }) => (
                        <NavLink
                            key={path}
                            to={path}
                            end={path === `/${role}`}
                            onClick={onClose}
                            className={({ isActive }) =>
                                `sidebar-link ${isActive ? "sidebar-link-active" : ""}`
                            }
                        >
                            <Icon size={19} strokeWidth={1.8} />
                            <span>{label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-bottom">
                    <div className="sidebar-bottom-icon">
                        <GraduationCap size={22} />
                    </div>
                    <div>
                        <strong>ExamPortal</strong>
                        <p>Academic assessment platform</p>
                    </div>
                </div>
            </aside>
        </>
    );
}