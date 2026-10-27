import { useCallback, useEffect, useMemo, useState } from "react";
import {
    CalendarDays,
    Clock,
    Plus,
    RefreshCw,
    Trash2,
    Users,
    AlertCircle,
    CheckCircle2,
} from "lucide-react";
import api from "../../services/api";

function formatDateTime(value) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
    });
}

function toLocalDateTimeInput(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    const offset = date.getTimezoneOffset() * 60_000;

    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function getCourseName(examination) {
    const course = examination?.course;

    if (!course) return "Course not specified";

    if (typeof course === "string") return course;

    return [course.courseCode, course.title].filter(Boolean).join(" — ") ||
        "Course not specified";
}

function getExaminationName(examination) {
    if (!examination) return "Examination unavailable";

    if (typeof examination === "string") return "Examination";

    return examination.title || "Untitled examination";
}

export default function ManageSlots() {
    const [examinations, setExaminations] = useState([]);
    const [slots, setSlots] = useState([]);
    const [selectedExamination, setSelectedExamination] = useState("");
    const [startTime, setStartTime] = useState("");
    const [capacity, setCapacity] = useState("1");

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const selectedExam = useMemo(
        () =>
            examinations.find(
                (exam) => exam._id === selectedExamination
            ),
        [examinations, selectedExamination]
    );

    const calculatedEndTime = useMemo(() => {
        if (!selectedExam || !startTime) return "";

        const start = new Date(startTime);

        if (Number.isNaN(start.getTime())) return "";

        const duration = Number(selectedExam.durationMinutes);

        if (!Number.isFinite(duration) || duration <= 0) return "";

        const end = new Date(start.getTime() + duration * 60_000);

        return toLocalDateTimeInput(end);
    }, [selectedExam, startTime]);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const [examResponse, slotResponse] = await Promise.all([
                api.get("/slots/assigned-examinations"),
                api.get("/slots/my-slots"),
            ]);

            setExaminations(examResponse.data?.data || []);
            setSlots(slotResponse.data?.data || []);
        } catch (err) {
            console.error("Failed to load examiner slots:", err);

            setError(
                err.response?.data?.message ||
                "Unable to load your examinations and availability slots."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleExaminationChange = (event) => {
        setSelectedExamination(event.target.value);
        setStartTime("");
        setError("");
        setSuccess("");
    };

    const handleCreateSlot = async (event) => {
        event.preventDefault();

        setError("");
        setSuccess("");

        if (!selectedExam) {
            setError("Please select an examination.");
            return;
        }

        if (!startTime || !calculatedEndTime) {
            setError("Please select a valid slot start date and time.");
            return;
        }

        const start = new Date(startTime);
        const end = new Date(calculatedEndTime);

        if (
            Number.isNaN(start.getTime()) ||
            Number.isNaN(end.getTime()) ||
            start >= end
        ) {
            setError("Please provide a valid slot start time.");
            return;
        }

        if (
            start < new Date(selectedExam.examinationStart) ||
            end > new Date(selectedExam.examinationEnd)
        ) {
            setError(
                "The slot must fall entirely within the examination schedule."
            );
            return;
        }

        const numericCapacity = Number(capacity);

        if (
            !Number.isInteger(numericCapacity) ||
            numericCapacity < 1 ||
            numericCapacity > 100
        ) {
            setError("Capacity must be a whole number between 1 and 100.");
            return;
        }

        setSubmitting(true);

        try {
            await api.post("/slots", {
                examination: selectedExam._id,
                startTime: start.toISOString(),
                endTime: end.toISOString(),
                capacity: numericCapacity,
            });

            setSuccess("Availability slot created successfully.");
            setStartTime("");
            setCapacity("1");

            await loadData();
        } catch (err) {
            console.error("Failed to create availability slot:", err);

            setError(
                err.response?.data?.message ||
                "Unable to create the availability slot. Please try again."
            );
        } finally {
            setSubmitting(false);
        }
    };

    const upcomingSlots = useMemo(
        () =>
            [...slots].sort(
                (a, b) =>
                    new Date(a.startTime).getTime() -
                    new Date(b.startTime).getTime()
            ),
        [slots]
    );

    return (
        <div className="manage-slots-page">
            <div className="page-header slots-page-header">
                <div>
                    <h1>Manage Availability Slots</h1>
                    <p>
                        Create and manage the time slots when students can book your
                        examinations.
                    </p>
                </div>

                <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={loadData}
                    disabled={loading}
                >
                    <RefreshCw size={16} />
                    {loading ? "Refreshing..." : "Refresh"}
                </button>
            </div>

            {error && (
                <div className="slot-alert slot-alert-error" role="alert">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                </div>
            )}

            {success && (
                <div className="slot-alert slot-alert-success" role="status">
                    <CheckCircle2 size={18} />
                    <span>{success}</span>
                </div>
            )}

            <div className="slot-summary-grid">
                <div className="slot-summary-card">
                    <div className="slot-summary-icon">
                        <CalendarDays size={21} />
                    </div>
                    <div>
                        <span>Assigned Examinations</span>
                        <strong>{examinations.length}</strong>
                    </div>
                </div>

                <div className="slot-summary-card">
                    <div className="slot-summary-icon">
                        <Clock size={21} />
                    </div>
                    <div>
                        <span>Total Availability Slots</span>
                        <strong>{slots.length}</strong>
                    </div>
                </div>
            </div>

            <section className="dashboard-card slot-form-card">
                <div className="slot-section-heading">
                    <div>
                        <h2>Create Availability Slot</h2>
                        <p>
                            Select an examination and choose when you are available.
                        </p>
                    </div>
                    <Plus size={22} />
                </div>

                {loading ? (
                    <p className="slots-empty-message">Loading your examinations...</p>
                ) : examinations.length === 0 ? (
                    <div className="slots-empty-message">
                        <CalendarDays size={28} />
                        <p>No published examinations are currently assigned to you.</p>
                        <span>
                            Ask the administrator to assign and publish an examination
                            before creating availability slots.
                        </span>
                    </div>
                ) : (
                    <form onSubmit={handleCreateSlot} className="slot-form">
                        <div className="form-group">
                            <label htmlFor="slot-examination">Examination</label>
                            <select
                                id="slot-examination"
                                value={selectedExamination}
                                onChange={handleExaminationChange}
                                required
                            >
                                <option value="">Select an examination</option>

                                {examinations.map((exam) => (
                                    <option key={exam._id} value={exam._id}>
                                        {exam.title} — {getCourseName(exam)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedExam && (
                            <div className="slot-exam-details">
                                <div>
                                    <span>Course</span>
                                    <strong>{getCourseName(selectedExam)}</strong>
                                </div>

                                <div>
                                    <span>Examination type</span>
                                    <strong>{selectedExam.examinationType || "—"}</strong>
                                </div>

                                <div>
                                    <span>Slot duration</span>
                                    <strong>
                                        {selectedExam.durationMinutes} minutes
                                    </strong>
                                </div>

                                <div>
                                    <span>Examination schedule</span>
                                    <strong>
                                        {formatDateTime(selectedExam.examinationStart)}
                                    </strong>
                                    <strong>
                                        to {formatDateTime(selectedExam.examinationEnd)}
                                    </strong>
                                </div>
                            </div>
                        )}

                        <div className="slot-form-fields">
                            <div className="form-group">
                                <label htmlFor="slot-start">
                                    Slot start date and time
                                </label>
                                <input
                                    id="slot-start"
                                    type="datetime-local"
                                    value={startTime}
                                    onChange={(event) => {
                                        setStartTime(event.target.value);
                                        setError("");
                                        setSuccess("");
                                    }}
                                    min={
                                        selectedExam
                                            ? toLocalDateTimeInput(
                                                selectedExam.examinationStart
                                            )
                                            : undefined
                                    }
                                    max={
                                        selectedExam
                                            ? toLocalDateTimeInput(
                                                selectedExam.examinationEnd
                                            )
                                            : undefined
                                    }
                                    required
                                    disabled={!selectedExam}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="slot-end">Slot end date and time</label>
                                <input
                                    id="slot-end"
                                    type="datetime-local"
                                    value={calculatedEndTime}
                                    readOnly
                                    disabled={!selectedExam || !startTime}
                                />
                                <small>
                                    Calculated automatically using the examination duration.
                                </small>
                            </div>

                            <div className="form-group">
                                <label htmlFor="slot-capacity">
                                    Student capacity
                                </label>
                                <input
                                    id="slot-capacity"
                                    type="number"
                                    min="1"
                                    max="100"
                                    step="1"
                                    value={capacity}
                                    onChange={(event) => setCapacity(event.target.value)}
                                    required
                                />
                                <small>Enter a whole number from 1 to 100.</small>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary slot-submit-button"
                            disabled={submitting || loading || !selectedExam}
                        >
                            <Plus size={17} />
                            {submitting ? "Creating Slot..." : "Create Availability Slot"}
                        </button>
                    </form>
                )}
            </section>

            <section className="dashboard-card slot-list-card">
                <div className="slot-section-heading">
                    <div>
                        <h2>My Availability Slots</h2>
                        <p>Review the slots you have created.</p>
                    </div>
                    <CalendarDays size={22} />
                </div>

                {loading ? (
                    <p className="slots-empty-message">Loading your slots...</p>
                ) : upcomingSlots.length === 0 ? (
                    <div className="slots-empty-message">
                        <Clock size={28} />
                        <p>You haven't created any availability slots yet.</p>
                        <span>Create your first slot using the form above.</span>
                    </div>
                ) : (
                    <div className="slots-table-wrapper">
                        <table className="data-table slots-table">
                            <thead>
                                <tr>
                                    <th>Examination</th>
                                    <th>Course</th>
                                    <th>Date</th>
                                    <th>Start Time</th>
                                    <th>End Time</th>
                                    <th>Capacity</th>
                                    <th>Status</th>
                                </tr>
                            </thead>

                            <tbody>
                                {upcomingSlots.map((slot) => {
                                    const exam = slot.examination;
                                    const active = slot.isActive !== false;

                                    return (
                                        <tr key={slot._id}>
                                            <td>
                                                <strong>{getExaminationName(exam)}</strong>
                                                {exam?.examinationType && (
                                                    <span className="slot-subtext">
                                                        {exam.examinationType}
                                                    </span>
                                                )}
                                            </td>

                                            <td>{getCourseName(exam)}</td>

                                            <td>
                                                {slot.startTime
                                                    ? new Date(slot.startTime).toLocaleDateString(
                                                        "en-IN",
                                                        {
                                                            day: "2-digit",
                                                            month: "short",
                                                            year: "numeric",
                                                        }
                                                    )
                                                    : "—"}
                                            </td>

                                            <td>
                                                {slot.startTime
                                                    ? new Date(slot.startTime).toLocaleTimeString(
                                                        "en-IN",
                                                        {
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        }
                                                    )
                                                    : "—"}
                                            </td>

                                            <td>
                                                {slot.endTime
                                                    ? new Date(slot.endTime).toLocaleTimeString(
                                                        "en-IN",
                                                        {
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        }
                                                    )
                                                    : "—"}
                                            </td>

                                            <td>
                                                <span className="slot-capacity">
                                                    <Users size={14} />
                                                    {slot.capacity ?? 1}
                                                </span>
                                            </td>

                                            <td>
                                                <span
                                                    className={`slot-status ${active ? "slot-status-active" : "slot-status-inactive"
                                                        }`}
                                                >
                                                    {active ? "Active" : "Inactive"}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}