import { useEffect, useState } from "react";
import {
    Award,
    BookOpen,
    CalendarDays,
    CheckCircle2,
    AlertCircle,
    LoaderCircle,
    RefreshCw,
    Search,
    MessageSquareText,
    GraduationCap,
} from "lucide-react";
import api from "../../services/api";

function formatDate(date) {
    if (!date) return "Not specified";

    return new Date(date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

function getPercentage(marksObtained, maxMarks) {
    if (!maxMarks || maxMarks <= 0) return 0;

    return Math.round((marksObtained / maxMarks) * 10000) / 100;
}

function getPerformanceClass(percentage) {
    if (percentage >= 75) return "student-result-excellent";
    if (percentage >= 50) return "student-result-good";
    return "student-result-needs-improvement";
}

export default function StudentResults() {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [sortOrder, setSortOrder] = useState("newest");

    const loadResults = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await api.get("/results/my-results");
            setResults(response.data.data || []);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to load your results. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadResults();
    }, []);

    const totalMarks = results.reduce(
        (total, result) => total + Number(result.marksObtained || 0),
        0
    );

    const totalMaximumMarks = results.reduce(
        (total, result) => total + Number(result.maxMarks || 0),
        0
    );

    const overallPercentage =
        totalMaximumMarks > 0
            ? Math.round((totalMarks / totalMaximumMarks) * 10000) / 100
            : 0;

    const filteredResults = results
        .filter((result) => {
            const query = search.trim().toLowerCase();
            const examination = result.examination || {};
            const examiner = result.examiner || {};

            return (
                (examination.title || "").toLowerCase().includes(query) ||
                (examination.examinationType || "").toLowerCase().includes(query) ||
                (examiner.fullName || "").toLowerCase().includes(query) ||
                (result.feedback || "").toLowerCase().includes(query)
            );
        })
        .sort((a, b) => {
            const dateA = new Date(a.publishedAt || a.createdAt || 0).getTime();
            const dateB = new Date(b.publishedAt || b.createdAt || 0).getTime();

            return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
        });

    if (loading) {
        return (
            <div className="student-results-loading">
                <LoaderCircle className="student-results-spin" size={30} />
                <p>Loading your results...</p>
            </div>
        );
    }

    return (
        <div className="student-results-page">
            <header className="student-results-header">
                <div>
                    <span className="student-results-eyebrow">
                        STUDENT PORTAL
                    </span>

                    <h1>My Results</h1>

                    <p>
                        Review your published examination marks and examiner feedback.
                    </p>
                </div>

                <button
                    type="button"
                    className="student-results-refresh"
                    onClick={loadResults}
                    disabled={loading}
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </header>

            {error && (
                <div className="student-results-alert error">
                    <AlertCircle size={19} />
                    <span>{error}</span>
                </div>
            )}

            <section className="student-results-summary">
                <div className="student-results-summary-card">
                    <div className="student-results-summary-icon">
                        <Award size={22} />
                    </div>

                    <div>
                        <span>Published Results</span>
                        <strong>{results.length}</strong>
                    </div>
                </div>

                <div className="student-results-summary-card">
                    <div className="student-results-summary-icon">
                        <BookOpen size={22} />
                    </div>

                    <div>
                        <span>Total Marks</span>
                        <strong>
                            {totalMarks} / {totalMaximumMarks}
                        </strong>
                    </div>
                </div>

                <div className="student-results-summary-card">
                    <div className="student-results-summary-icon">
                        <GraduationCap size={22} />
                    </div>

                    <div>
                        <span>Overall Percentage</span>
                        <strong>{overallPercentage}%</strong>
                    </div>
                </div>
            </section>

            <section className="student-results-panel">
                <div className="student-results-toolbar">
                    <div className="student-results-search">
                        <Search size={17} />

                        <input
                            type="search"
                            placeholder="Search examinations or feedback..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                    </div>

                    <select
                        aria-label="Sort results"
                        value={sortOrder}
                        onChange={(event) => setSortOrder(event.target.value)}
                    >
                        <option value="newest">Newest first</option>
                        <option value="oldest">Oldest first</option>
                    </select>
                </div>

                {filteredResults.length === 0 ? (
                    <div className="student-results-empty">
                        <div className="student-results-empty-icon">
                            <Award size={30} />
                        </div>

                        <h3>
                            {results.length === 0
                                ? "No published results yet"
                                : "No matching results"}
                        </h3>

                        <p>
                            {results.length === 0
                                ? "Your results will appear here once the administrator publishes them."
                                : "Try another search term."}
                        </p>
                    </div>
                ) : (
                    <div className="student-results-list">
                        {filteredResults.map((result) => {
                            const examination = result.examination || {};
                            const examiner = result.examiner || {};

                            const marks = Number(result.marksObtained || 0);
                            const maximum = Number(result.maxMarks || 0);
                            const percentage = getPercentage(marks, maximum);

                            return (
                                <article
                                    className="student-result-card"
                                    key={result._id}
                                >
                                    <div className="student-result-card-header">
                                        <div className="student-result-exam-icon">
                                            <BookOpen size={22} />
                                        </div>

                                        <div className="student-result-title">
                                            <h2>
                                                {examination.title || "Examination"}
                                            </h2>

                                            <span className="student-result-type">
                                                {(
                                                    examination.examinationType || "Examination"
                                                ).toUpperCase()}
                                            </span>
                                        </div>

                                        <span className="student-result-published">
                                            <CheckCircle2 size={14} />
                                            Published
                                        </span>
                                    </div>

                                    <div className="student-result-marks">
                                        <div>
                                            <span>Marks Obtained</span>

                                            <strong>
                                                {marks}{" "}
                                                <small>/ {maximum}</small>
                                            </strong>
                                        </div>

                                        <div>
                                            <span>Percentage</span>

                                            <strong
                                                className={getPerformanceClass(percentage)}
                                            >
                                                {percentage}%
                                            </strong>
                                        </div>
                                    </div>

                                    <div className="student-result-progress">
                                        <div
                                            className="student-result-progress-fill"
                                            style={{
                                                width: `${Math.min(100, Math.max(0, percentage))}%`,
                                            }}
                                        />
                                    </div>

                                    <div className="student-result-meta">
                                        <div>
                                            <CalendarDays size={16} />

                                            <span>
                                                <small>Examination date</small>
                                                {formatDate(examination.examinationStart)}
                                            </span>
                                        </div>

                                        <div>
                                            <Award size={16} />

                                            <span>
                                                <small>Evaluated by</small>
                                                {examiner.fullName || "Examiner"}
                                            </span>
                                        </div>

                                        <div>
                                            <CheckCircle2 size={16} />

                                            <span>
                                                <small>Published on</small>
                                                {formatDate(result.publishedAt)}
                                            </span>
                                        </div>
                                    </div>

                                    {result.feedback && (
                                        <div className="student-result-feedback">
                                            <MessageSquareText size={18} />

                                            <div>
                                                <strong>Examiner Feedback</strong>
                                                <p>{result.feedback}</p>
                                            </div>
                                        </div>
                                    )}
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
}
