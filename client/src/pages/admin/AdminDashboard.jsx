import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    BookOpen,
    ClipboardList,
    Users,
    FileCheck,
    ArrowRight,
    ShieldCheck
} from "lucide-react";

import api from "../../services/api";
import StatCard from "../../components/StatCard";
import PageHeader from "../../components/PageHeader";

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        courses: 0,
        examinations: 0,
        pendingExaminers: 0,
        pendingResults: 0
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;

        async function loadDashboard() {
            setLoading(true);
            setError("");

            const requests = await Promise.allSettled([
                api.get("/courses"),
                api.get("/examinations"),
                api.get("/admin/examiners/pending"),
                api.get("/results/pending")
            ]);

            if (!active) return;

            const next = {
                courses: 0,
                examinations: 0,
                pendingExaminers: 0,
                pendingResults: 0
            };

            const keys = [
                "courses",
                "examinations",
                "pendingExaminers",
                "pendingResults"
            ];

            let failures = 0;

            requests.forEach((result, index) => {
                if (result.status === "fulfilled") {
                    const body = result.value.data;
                    const items = body.data;

                    next[keys[index]] =
                        body.count ??
                        (Array.isArray(items) ? items.length : 0);
                } else {
                    failures += 1;
                }
            });

            setStats(next);

            if (failures === requests.length) {
                setError("Unable to load dashboard information. Please try again.");
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
                title="Admin Dashboard"
                description="Manage courses, examinations, examiners, and results."
            />

            {error && (
                <div className="alert alert-error" role="alert">
                    {error}
                </div>
            )}

            <section className="welcome-banner">
                <div>
                    <div className="welcome-label">
                        <ShieldCheck size={16} />
                        ADMINISTRATOR WORKSPACE
                    </div>

                    <h2>Welcome to ExamPortal</h2>

                    <p>
                        Manage the examination lifecycle from one central workspace.
                    </p>
                </div>

                <div className="welcome-illustration">
                    <ClipboardList size={54} strokeWidth={1.4} />
                </div>
            </section>

            <section className="stats-grid">
                <StatCard
                    title="Courses"
                    value={stats.courses}
                    description="Courses in the system"
                    icon={BookOpen}
                    loading={loading}
                />

                <StatCard
                    title="Examinations"
                    value={stats.examinations}
                    description="Examinations created"
                    icon={ClipboardList}
                    loading={loading}
                />

                <StatCard
                    title="Pending Examiners"
                    value={stats.pendingExaminers}
                    description="Accounts awaiting approval"
                    icon={Users}
                    loading={loading}
                />

                <StatCard
                    title="Pending Results"
                    value={stats.pendingResults}
                    description="Evaluations awaiting publication"
                    icon={FileCheck}
                    loading={loading}
                />
            </section>

            <section className="section-heading">
                <div>
                    <h2>Management</h2>
                    <p>Quick access to administrative tasks.</p>
                </div>
            </section>

            <section className="quick-actions-grid">
                <Link to="/admin/courses" className="quick-action-card">
                    <div className="quick-action-icon">
                        <BookOpen size={23} />
                    </div>
                    <div>
                        <h3>Manage Courses</h3>
                        <p>Create courses and manage course details.</p>
                    </div>
                    <ArrowRight size={19} className="quick-action-arrow" />
                </Link>

                <Link to="/admin/examinations" className="quick-action-card">
                    <div className="quick-action-icon">
                        <ClipboardList size={23} />
                    </div>
                    <div>
                        <h3>Manage Examinations</h3>
                        <p>Create, publish, and manage examinations.</p>
                    </div>
                    <ArrowRight size={19} className="quick-action-arrow" />
                </Link>

                <Link to="/admin/examiners" className="quick-action-card">
                    <div className="quick-action-icon">
                        <Users size={23} />
                    </div>
                    <div>
                        <h3>Manage Examiners</h3>
                        <p>Review examiner registration requests.</p>
                    </div>
                    <ArrowRight size={19} className="quick-action-arrow" />
                </Link>

                <Link to="/admin/results" className="quick-action-card">
                    <div className="quick-action-icon">
                        <FileCheck size={23} />
                    </div>
                    <div>
                        <h3>Manage Results</h3>
                        <p>Review evaluations and publish results.</p>
                    </div>
                    <ArrowRight size={19} className="quick-action-arrow" />
                </Link>
            </section>
        </>
    );
}