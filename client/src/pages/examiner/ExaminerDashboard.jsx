import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    ClipboardList,
    CalendarDays,
    GraduationCap,
    ArrowRight
} from "lucide-react";

import api from "../../services/api";
import StatCard from "../../components/StatCard";
import PageHeader from "../../components/PageHeader";

export default function ExaminerDashboard() {
    const [stats, setStats] = useState({
        examinations: 0,
        slots: 0,
        evaluations: 0
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;

        async function loadDashboard() {
            const requests = await Promise.allSettled([
                api.get("/slots/assigned-examinations"),
                api.get("/slots/my-slots"),
                api.get("/evaluations/my-evaluations")
            ]);

            if (!active) return;

            const keys = ["examinations", "slots", "evaluations"];
            const next = { examinations: 0, slots: 0, evaluations: 0 };

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
                title="Examiner Dashboard"
                description="Manage your examination schedule and student evaluations."
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
                        EXAMINER WORKSPACE
                    </div>

                    <h2>Your examination workspace</h2>

                    <p>
                        Review assigned examinations, manage available slots, and evaluate students.
                    </p>
                </div>

                <div className="welcome-illustration">
                    <GraduationCap size={54} strokeWidth={1.4} />
                </div>
            </section>

            <section className="stats-grid">
                <StatCard
                    title="Assigned Examinations"
                    value={stats.examinations}
                    description="Published examinations assigned to you"
                    icon={ClipboardList}
                    loading={loading}
                />

                <StatCard
                    title="My Slots"
                    value={stats.slots}
                    description="Availability slots created"
                    icon={CalendarDays}
                    loading={loading}
                />

                <StatCard
                    title="Evaluations"
                    value={stats.evaluations}
                    description="Evaluations submitted"
                    icon={GraduationCap}
                    loading={loading}
                />
            </section>

            <section className="section-heading">
                <div>
                    <h2>Your workspace</h2>
                    <p>Continue with your examination tasks.</p>
                </div>
            </section>

            <section className="quick-actions-grid">
                <Link to="/examiner/slots" className="quick-action-card">
                    <div className="quick-action-icon">
                        <CalendarDays size={23} />
                    </div>
                    <div>
                        <h3>Manage Slots</h3>
                        <p>View assigned examinations and create availability slots.</p>
                    </div>
                    <ArrowRight size={19} className="quick-action-arrow" />
                </Link>

                <Link to="/examiner/evaluate" className="quick-action-card">
                    <div className="quick-action-icon">
                        <GraduationCap size={23} />
                    </div>
                    <div>
                        <h3>Evaluate Students</h3>
                        <p>Review eligible bookings and submit marks.</p>
                    </div>
                    <ArrowRight size={19} className="quick-action-arrow" />
                </Link>
            </section>
        </>
    );
}