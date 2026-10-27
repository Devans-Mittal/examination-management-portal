import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
    const { user, login } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        email: "",
        password: ""
    });

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    if (user) {
        const destination = {
            admin: "/admin",
            examiner: "/examiner",
            student: "/student",
        };

        return (
            <Navigate
                to={destination[user.role] || "/login"}
                replace
            />
        );
    }
    const handleChange = (event) => {
        setForm({
            ...form,
            [event.target.name]: event.target.value
        });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setLoading(true);

        try {
            const loggedInUser = await login(form.email, form.password);

            if (loggedInUser.role === "admin") {
                navigate("/admin");
            } else if (loggedInUser.role === "examiner") {
                navigate("/examiner");
            } else {
                navigate("/student");
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.message ||
                "Unable to log in. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="auth-page">
            <section className="auth-card">
                <div className="auth-brand">
                    <div className="brand-icon">E</div>
                    <div>
                        <h1>ExamPortal</h1>
                        <p>Examination Management System</p>
                    </div>
                </div>

                <div className="auth-heading">
                    <h2>Welcome back</h2>
                    <p>Sign in to manage your examinations.</p>
                </div>

                {error && (
                    <div className="alert alert-error" role="alert">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <label htmlFor="email">Email address</label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="you@example.com"
                        value={form.email}
                        onChange={handleChange}
                        autoComplete="email"
                        required
                    />

                    <label htmlFor="password">Password</label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="Enter your password"
                        value={form.password}
                        onChange={handleChange}
                        autoComplete="current-password"
                        required
                    />

                    <button className="btn btn-primary btn-full" disabled={loading}>
                        {loading ? "Signing in..." : "Sign in"}
                    </button>
                </form>

                <p className="auth-footer">
                    Don't have an account? <Link to="/register">Create one</Link>
                </p>
            </section>
        </main>
    );
}