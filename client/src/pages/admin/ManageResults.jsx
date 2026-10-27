import { useEffect, useMemo, useState } from "react";
import { CheckCircle, Search, RefreshCw, Award, Clock, Users } from "lucide-react";
import ConfirmDialog from "../../components/ConfirmDialog";
import api from "../../services/api";

export default function ManageResults() {
    const [evaluations, setEvaluations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [publishingId, setPublishingId] = useState("");
    const [search, setSearch] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [filter, setFilter] = useState("pending");
    const [confirmationOpen, setConfirmationOpen] = useState(false);
    const [selectedEvaluationId, setSelectedEvaluationId] = useState("");

    const fetchResults = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await api.get("/results/pending");
            setEvaluations(response.data?.data || []);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to load submitted evaluations. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchResults();
    }, []);

    const filteredEvaluations = useMemo(() => {
        const query = search.trim().toLowerCase();

        return evaluations.filter((evaluation) => {
            const studentName = evaluation.student?.fullName || "";
            const studentEmail = evaluation.student?.email || "";
            const examTitle = evaluation.examination?.title || "";
            const examinerName = evaluation.examiner?.fullName || "";

            const matchesSearch = [
                studentName,
                studentEmail,
                examTitle,
                examinerName,
            ].some((value) => value.toLowerCase().includes(query));

            const matchesFilter =
                filter === "all" || evaluation.status === filter;

            return matchesSearch && matchesFilter;
        });
    }, [evaluations, search, filter]);

    const requestPublish = (evaluationId) => {
        setError("");
        setMessage("");
        setSelectedEvaluationId(evaluationId);
        setConfirmationOpen(true);
    };

    const publishResult = async () => {
        if (!selectedEvaluationId || publishingId) return;

        const evaluationId = selectedEvaluationId;

        setPublishingId(evaluationId);
        setMessage("");
        setError("");

        try {
            const response = await api.patch(
                `/results/${evaluationId}/publish`
            );

            setEvaluations((previous) =>
                previous.filter(
                    (evaluation) => evaluation._id !== evaluationId
                )
            );

            setMessage(
                response.data?.message || "Result published successfully."
            );

            setConfirmationOpen(false);
            setSelectedEvaluationId("");
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to publish this result. Please try again."
            );
        } finally {
            setPublishingId("");
        }
    };

    const formatDate = (date) => {
        if (!date) return "—";

        return new Date(date).toLocaleString("en-IN", {
            dateStyle: "medium",
            timeStyle: "short",
        });
    };

    const getPercentage = (marks, maximum) => {
        if (!maximum || maximum <= 0) return "—";
        return `${((marks / maximum) * 100).toFixed(1)}%`;
    };

    return (
        <section className="manage-results-page">
            <div className="page-header">
                <div>
                    <h1>Manage Results</h1>
                    <p>
                        Review submitted evaluations and publish results for students.
                    </p>
                </div>

                <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={fetchResults}
                    disabled={loading}
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </div>

            <div className="results-summary-grid">
                <div className="results-summary-card">
                    <div className="results-summary-icon">
                        <Clock size={21} />
                    </div>
                    <div>
                        <p>Awaiting Publication</p>
                        <h2>{evaluations.length}</h2>
                    </div>
                </div>

                <div className="results-summary-card">
                    <div className="results-summary-icon">
                        <Award size={21} />
                    </div>
                    <div>
                        <p>Displayed Evaluations</p>
                        <h2>{filteredEvaluations.length}</h2>
                    </div>
                </div>

                <div className="results-summary-card">
                    <div className="results-summary-icon">
                        <Users size={21} />
                    </div>
                    <div>
                        <p>Students Evaluated</p>
                        <h2>
                            {
                                new Set(
                                    evaluations.map((evaluation) => evaluation.student?._id)
                                ).size
                            }
                        </h2>
                    </div>
                </div>
            </div>

            {message && (
                <div className="results-alert results-alert-success" role="status">
                    <CheckCircle size={18} />
                    {message}
                </div>
            )}

            {error && (
                <div className="results-alert results-alert-error" role="alert">
                    {error}
                </div>
            )}

            <div className="results-toolbar">
                <div className="results-search">
                    <Search size={18} />
                    <input
                        type="search"
                        placeholder="Search student, examiner or examination..."
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                    />
                </div>

                <select
                    value={filter}
                    onChange={(event) => setFilter(event.target.value)}
                    aria-label="Filter evaluations"
                >
                    <option value="pending">Awaiting publication</option>
                    <option value="all">All loaded evaluations</option>
                </select>
            </div>

            {loading ? (
                <div className="results-empty-state">Loading submitted evaluations...</div>
            ) : filteredEvaluations.length === 0 ? (
                <div className="results-empty-state">
                    <Award size={36} />
                    <h3>No evaluations found</h3>
                    <p>
                        {evaluations.length === 0
                            ? "There are currently no submitted evaluations awaiting publication."
                            : "Try changing your search or filter."}
                    </p>
                </div>
            ) : (
                <div className="results-table-wrapper">
                    <table className="results-table">
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Examination</th>
                                <th>Examiner</th>
                                <th>Marks</th>
                                <th>Percentage</th>
                                <th>Submitted</th>
                                <th>Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredEvaluations.map((evaluation) => (
                                <tr key={evaluation._id}>
                                    <td>
                                        <div className="results-person">
                                            <strong>
                                                {evaluation.student?.fullName || "Unknown student"}
                                            </strong>
                                            <span>{evaluation.student?.email || "—"}</span>
                                        </div>
                                    </td>

                                    <td>
                                        <strong>
                                            {evaluation.examination?.title || "Unknown examination"}
                                        </strong>
                                    </td>

                                    <td>{evaluation.examiner?.fullName || "—"}</td>

                                    <td>
                                        <strong>
                                            {evaluation.marksObtained} / {evaluation.maxMarks}
                                        </strong>
                                    </td>

                                    <td>
                                        <span className="results-percentage">
                                            {getPercentage(
                                                evaluation.marksObtained,
                                                evaluation.maxMarks
                                            )}
                                        </span>
                                    </td>

                                    <td>{formatDate(evaluation.evaluatedAt || evaluation.createdAt)}</td>

                                    <td>
                                        <button
                                            type="button"
                                            className="btn btn-primary results-publish-button"
                                            onClick={() => requestPublish(evaluation._id)}
                                            disabled={publishingId === evaluation._id}
                                        >
                                            <CheckCircle size={15} />
                                            {publishingId === evaluation._id
                                                ? "Publishing..."
                                                : "Publish"}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            <ConfirmDialog
                open={confirmationOpen}
                title="Publish this result?"
                message="Are you sure you want to publish this examination result? Once published, the student will be able to view their result."
                confirmText="Publish Result"
                cancelText="Go Back"
                loading={Boolean(publishingId)}
                onConfirm={publishResult}
                onCancel={() => {
                    if (publishingId) return;

                    setConfirmationOpen(false);
                    setSelectedEvaluationId("");
                }}
            />
        </section>
    );
}

