import { useEffect, useState } from "react";
import {
    AlertCircle,
    CheckCircle2,
    ClipboardCheck,
    LoaderCircle,
    RefreshCw,
    Search,
    UserRound
} from "lucide-react";
import api from "../../services/api";

export default function EvaluateStudents() {
    const [students, setStudents] = useState([]);
    const [evaluations, setEvaluations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [search, setSearch] = useState("");
    const [activeStudent, setActiveStudent] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState({
        marksObtained: "",
        maxMarks: "100",
        feedback: ""
    });

    const loadData = async () => {
        setLoading(true);
        setError("");

        try {
            const [studentsResponse, evaluationsResponse] =
                await Promise.all([
                    api.get("/evaluations/students"),
                    api.get("/evaluations/my-evaluations")
                ]);

            setStudents(studentsResponse.data.data || []);
            setEvaluations(evaluationsResponse.data.data || []);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to load evaluation data. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const evaluatedKeys = new Set(
        evaluations.map(
            (evaluation) =>
                `${evaluation.examination?._id}-${evaluation.student?._id}`
        )
    );

    const filteredStudents = students.filter((booking) => {
        const studentName = booking.student?.fullName || "";
        const studentEmail = booking.student?.email || "";
        const examTitle = booking.examination?.title || "";

        const query = search.toLowerCase();

        return (
            studentName.toLowerCase().includes(query) ||
            studentEmail.toLowerCase().includes(query) ||
            examTitle.toLowerCase().includes(query)
        );
    });

    const openEvaluationForm = (booking) => {
        setActiveStudent(booking);
        setForm({
            marksObtained: "",
            maxMarks: "100",
            feedback: ""
        });
        setError("");
        setSuccess("");
    };

    const closeEvaluationForm = () => {
        setActiveStudent(null);
        setForm({
            marksObtained: "",
            maxMarks: "100",
            feedback: ""
        });
    };

    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!activeStudent) return;

        const marksObtained = Number(form.marksObtained);
        const maxMarks = Number(form.maxMarks);

        if (
            form.marksObtained.trim() === "" ||
            form.maxMarks.trim() === "" ||
            !Number.isFinite(marksObtained) ||
            !Number.isFinite(maxMarks) ||
            maxMarks <= 0 ||
            marksObtained < 0 ||
            marksObtained > maxMarks
        ) {
            setError(
                "Enter valid marks. Obtained marks cannot exceed maximum marks."
            );
            return;
        }

        const examinationId = activeStudent.examination?._id;
        const studentId = activeStudent.student?._id;

        if (!examinationId || !studentId) {
            setError("Student or examination information is missing.");
            return;
        }

        setSubmitting(true);
        setError("");
        setSuccess("");

        try {
            const response = await api.post("/evaluations", {
                examination: examinationId,
                student: studentId,
                marksObtained,
                maxMarks,
                feedback: form.feedback.trim()
            });

            setSuccess(
                response.data.message || "Evaluation submitted successfully."
            );

            closeEvaluationForm();
            await loadData();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to submit evaluation. Please try again."
            );
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="evaluation-loading">
                <LoaderCircle className="spin" size={28} />
                <p>Loading evaluation records...</p>
            </div>
        );
    }

    return (
        <div className="evaluation-page">
            <div className="evaluation-header">
                <div>
                    <span className="evaluation-eyebrow">
                        EXAMINER WORKSPACE
                    </span>

                    <h1>Evaluate Students</h1>

                    <p>
                        Review examination bookings and submit student marks
                        and feedback.
                    </p>
                </div>

                <button
                    type="button"
                    className="evaluation-refresh"
                    onClick={loadData}
                    disabled={loading}
                >
                    <RefreshCw size={17} />
                    Refresh
                </button>
            </div>

            {error && (
                <div className="evaluation-alert error">
                    <AlertCircle size={19} />
                    <span>{error}</span>
                </div>
            )}

            {success && (
                <div className="evaluation-alert success">
                    <CheckCircle2 size={19} />
                    <span>{success}</span>
                </div>
            )}

            <div className="evaluation-stats">
                <div className="evaluation-stat-card">
                    <div className="evaluation-stat-icon">
                        <UserRound size={22} />
                    </div>

                    <div>
                        <span>Booked Students</span>
                        <h2>{students.length}</h2>
                    </div>
                </div>

                <div className="evaluation-stat-card">
                    <div className="evaluation-stat-icon">
                        <ClipboardCheck size={22} />
                    </div>

                    <div>
                        <span>Evaluations Submitted</span>
                        <h2>{evaluations.length}</h2>
                    </div>
                </div>
            </div>

            <div className="evaluation-content-card">
                <div className="evaluation-section-header">
                    <div>
                        <h2>Student Evaluation Queue</h2>
                        <p>
                            Examinations and students assigned to your account.
                        </p>
                    </div>

                    <div className="evaluation-search">
                        <Search size={18} />

                        <input
                            type="text"
                            placeholder="Search student or examination..."
                            value={search}
                            onChange={(event) =>
                                setSearch(event.target.value)
                            }
                        />
                    </div>
                </div>

                {filteredStudents.length === 0 ? (
                    <div className="evaluation-empty">
                        <ClipboardCheck size={38} />

                        <h3>No students found</h3>

                        <p>
                            {students.length === 0
                                ? "Students with active bookings will appear here."
                                : "Try changing your search."}
                        </p>
                    </div>
                ) : (
                    <div className="evaluation-table-wrapper">
                        <table className="evaluation-table">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Examination</th>
                                    <th>Type</th>
                                    <th>Scheduled Slot</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredStudents.map((booking) => {
                                    const student =
                                        booking.student || {};

                                    const examination =
                                        booking.examination || {};

                                    const key =
                                        `${examination._id}-${student._id}`;

                                    const alreadyEvaluated =
                                        evaluatedKeys.has(key);

                                    const isCompleted =
                                        examination.status === "completed";

                                    const slot = booking.slot || {};

                                    return (
                                        <tr key={booking._id}>
                                            <td>
                                                <div className="evaluation-student">
                                                    <div className="evaluation-avatar">
                                                        {(student.fullName || "S")
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </div>

                                                    <div>
                                                        <strong>
                                                            {student.fullName ||
                                                                "Unknown student"}
                                                        </strong>

                                                        <span>
                                                            {student.email || "—"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            <td>
                                                <strong>
                                                    {examination.title || "—"}
                                                </strong>
                                            </td>

                                            <td>
                                                <span className="evaluation-type">
                                                    {examination.examinationType ||
                                                        "—"}
                                                </span>
                                            </td>

                                            <td>
                                                {slot.startTime
                                                    ? new Date(
                                                        slot.startTime
                                                    ).toLocaleString()
                                                    : "—"}
                                            </td>

                                            <td>
                                                {alreadyEvaluated ? (
                                                    <span className="evaluation-badge submitted">
                                                        Submitted
                                                    </span>
                                                ) : isCompleted ? (
                                                    <span className="evaluation-badge pending">
                                                        Awaiting evaluation
                                                    </span>
                                                ) : (
                                                    <span className="evaluation-badge unavailable">
                                                        Exam not completed
                                                    </span>
                                                )}
                                            </td>

                                            <td>
                                                {alreadyEvaluated ? (
                                                    <span className="evaluation-done">
                                                        <CheckCircle2 size={16} />
                                                        Done
                                                    </span>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        className="evaluation-action"
                                                        disabled={!isCompleted}
                                                        onClick={() =>
                                                            openEvaluationForm(
                                                                booking
                                                            )
                                                        }
                                                    >
                                                        Evaluate
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {activeStudent && (
                <div
                    className="evaluation-modal-backdrop"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            closeEvaluationForm();
                        }
                    }}
                >
                    <div
                        className="evaluation-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="evaluation-modal-title"
                    >
                        <div className="evaluation-modal-header">
                            <div>
                                <span className="evaluation-eyebrow">
                                    STUDENT ASSESSMENT
                                </span>

                                <h2 id="evaluation-modal-title">
                                    Submit Evaluation
                                </h2>
                            </div>

                            <button
                                type="button"
                                className="evaluation-close"
                                onClick={closeEvaluationForm}
                                disabled={submitting}
                                aria-label="Close evaluation form"
                            >
                                ×
                            </button>
                        </div>

                        <div className="evaluation-student-summary">
                            <strong>
                                {activeStudent.student?.fullName}
                            </strong>

                            <span>
                                {activeStudent.examination?.title}
                            </span>

                            <span>
                                {activeStudent.student?.email}
                            </span>
                        </div>

                        {activeStudent.examination?.status !== "completed" && (
                            <div className="evaluation-alert error">
                                This examination must be marked completed
                                before evaluation.
                            </div>
                        )}

                        <form
                            className="evaluation-form"
                            onSubmit={handleSubmit}
                        >
                            <div className="evaluation-form-row">
                                <label>
                                    Marks Obtained
                                    <input
                                        type="number"
                                        name="marksObtained"
                                        value={form.marksObtained}
                                        onChange={handleChange}
                                        min="0"
                                        max={form.maxMarks || undefined}
                                        step="any"
                                        required
                                    />
                                </label>

                                <label>
                                    Maximum Marks
                                    <input
                                        type="number"
                                        name="maxMarks"
                                        value={form.maxMarks}
                                        onChange={handleChange}
                                        min="0.01"
                                        step="any"
                                        required
                                    />
                                </label>
                            </div>

                            <label>
                                Feedback
                                <textarea
                                    name="feedback"
                                    value={form.feedback}
                                    onChange={handleChange}
                                    rows="4"
                                    maxLength="2000"
                                    placeholder="Enter performance feedback..."
                                />
                            </label>

                            <div className="evaluation-form-actions">
                                <button
                                    type="button"
                                    className="evaluation-cancel"
                                    onClick={closeEvaluationForm}
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="evaluation-submit"
                                    disabled={
                                        submitting ||
                                        activeStudent.examination?.status !==
                                        "completed"
                                    }
                                >
                                    {submitting ? (
                                        <>
                                            <LoaderCircle
                                                className="spin"
                                                size={17}
                                            />
                                            Submitting...
                                        </>
                                    ) : (
                                        "Submit Evaluation"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
