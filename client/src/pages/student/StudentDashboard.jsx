import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    BookOpen,
    CalendarCheck,
    FileCheck,
    ArrowRight,
    GraduationCap
} from "lucide-react";

import api from "../../services/api";
import StatCard from "../../components/StatCard";
import PageHeader from "../../components/PageHeader";

export default function StudentDashboard() {
    const [stats, setStats] = useState({
        available: 0,
        bookings: 0,
        results: 0
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;

        async function loadDashboard() {
            const requests = await Promise.allSettled([
                api.get("/bookings/available-examinations"),
                api.get("/bookings/my-bookings"),
                api.get("/results/my-results")
            ]);

            if (!active) return;

            const keys = ["available", "bookings", "results"];
            const next = { available: 0, bookings: 0, results: 0 };

            let failures = 0;

            requests.forEach((result, index) => {
                if (result.status === "fulfilled") {
                    const body = result.value.data;

                    next[keys[index]] =
                        body.count ??
                        (Array.isArray(body.data) ? body.data.length : 0);
                } else {
                    failures += 1;
                }
            });

            setStats(next);

            if (failures === requests.length) {
                setError("Unable to load dashboard information.");
            } else if (failures > 0) {
                setError("Some dashboard information could not be loaded.");
            }

            setLoading(false);
        }

        loadDashboard();

        return () => {
            active = false;
        };
    }, []);

    return (
        <>
            <PageHeader
                title="Student Dashboard"
                description="Explore examinations, manage bookings, and view results."
            />

            {error && (
                <div className="alert alert-error" role="alert">
                    {error}
                </div>
            )}

            <section className="welcome-banner">
                <div>
                    <div className="welcome-label">
                        <GraduationCap size={17} />
                        STUDENT WORKSPACE
                    </div>

                    <h2>Your academic assessment hub</h2>

                    <p>
                        Find available examinations, manage your bookings, and keep track of results.
                    </p>
                </div>

                <div className="welcome-illustration">
                    <BookOpen size={54} strokeWidth={1.4} />
                </div>
            </section>

            <section className="stats-grid">
                <StatCard
                    title="Available Examinations"
                    value={stats.available}
                    description="Examinations currently open for booking"
                    icon={BookOpen}
                    loading={loading}
                />

                <StatCard
                    title="My Bookings"
                    value={stats.bookings}
                    description="Your recorded examination bookings"
                    icon={CalendarCheck}
                    loading={loading}
                />

                <StatCard
                    title="Published Results"
                    value={stats.results}
                    description="Results available to view"
                    icon={FileCheck}
                    loading={loading}
                />
            </section>

            <section className="section-heading">
                <div>
                    <h2>Quick actions</h2>
                    <p>Manage your examination activities.</p>
                </div>
            </section>

            <section className="quick-actions-grid">
                <Link to="/student/examinations" className="quick-action-card">
                    <div className="quick-action-icon">
                        <BookOpen size={23} />
                    </div>
                    <div>
                        <h3>Available Examinations</h3>
                        <p>Browse examinations and book a suitable slot.</p>
                    </div>
                    <ArrowRight size={19} className="quick-action-arrow" />
                </Link>

                <Link to="/student/bookings" className="quick-action-card">
                    <div className="quick-action-icon">
                        <CalendarCheck size={23} />
                    </div>
                    <div>
                        <h3>My Bookings</h3>
                        <p>Review or cancel eligible examination bookings.</p>
                    </div>
                    <ArrowRight size={19} className="quick-action-arrow" />
                </Link>

                <Link to="/student/results" className="quick-action-card">
                    <div className="quick-action-icon">
                        <FileCheck size={23} />
                    </div>
                    <div>
                        <h3>My Results</h3>
                        <p>View marks and feedback after publication.</p>
                    </div>
                    <ArrowRight size={19} className="quick-action-arrow" />
                </Link>
            </section>
        </>
    );
}