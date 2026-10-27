import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
    const { register } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        fullName: "",
        email: "",
        password: "",
        department: "",
        role: "student"
    });

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (event) => {
        setForm({
            ...form,
            [event.target.name]: event.target.value
        });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);

        try {
            await register({
                fullName: form.fullName.trim(),
                email: form.email.trim(),
                password: form.password,
                department: form.department.trim(),
                role: form.role
            });

            if (form.role === "examiner") {
                setSuccess(
                    "Registration successful. Your account is awaiting admin approval."
                );
            } else {
                setSuccess("Registration successful. You can now sign in.");
            }

            setTimeout(() => navigate("/login"), 1800);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Registration failed. Please check your details."
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
                        <p>Create your account</p>
                    </div>
                </div>

                <div className="auth-heading">
                    <h2>Join ExamPortal</h2>
                    <p>Register as a student or examiner.</p>
                </div>

                {error && (
                    <div className="alert alert-error" role="alert">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="alert alert-success" role="status">
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <label htmlFor="fullName">Full name</label>
                    <input
                        id="fullName"
                        name="fullName"
                        type="text"
                        placeholder="Your full name"
                        value={form.fullName}
                        onChange={handleChange}
                        minLength={2}
                        maxLength={100}
                        autoComplete="name"
                        required
                    />

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

                    <label htmlFor="department">Department</label>
                    <input
                        id="department"
                        name="department"
                        type="text"
                        placeholder="e.g. Computer Science"
                        value={form.department}
                        onChange={handleChange}
                        maxLength={100}
                    />

                    <label htmlFor="role">Register as</label>
                    <select
                        id="role"
                        name="role"
                        value={form.role}
                        onChange={handleChange}
                    >
                        <option value="student">Student</option>
                        <option value="examiner">Examiner</option>
                    </select>

                    <label htmlFor="password">Password</label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="At least 8 characters"
                        value={form.password}
                        onChange={handleChange}
                        minLength={8}
                        autoComplete="new-password"
                        required
                    />

                    <button className="btn btn-primary btn-full" disabled={loading}>
                        {loading ? "Creating account..." : "Create account"}
                    </button>
                </form>

                <p className="auth-footer">
                    Already registered? <Link to="/login">Sign in</Link>
                </p>
            </section>
        </main>
    );
}