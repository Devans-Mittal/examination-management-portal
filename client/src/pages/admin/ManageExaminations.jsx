import { useCallback, useEffect, useState } from "react";
import ConfirmDialog from "../../components/ConfirmDialog";
import {
    CalendarDays,
    Clock,
    Plus,
    RefreshCw,
    Search,
    X,
    BookOpen,
    Users,
    Pencil,
    Send,
    Ban,
    CheckCircle,
} from "lucide-react";
import api from "../../services/api";

const emptyForm = {
    title: "",
    description: "",
    course: "",
    examinationType: "viva",
    examiners: [],
    bookingStart: "",
    bookingEnd: "",
    examinationStart: "",
    examinationEnd: "",
    durationMinutes: 30,
};

const typeLabels = {
    viva: "Viva",
    practical: "Practical",
    project: "Project",
    theory: "Theory",
};

const statusLabels = {
    draft: "Draft",
    published: "Published",
    completed: "Completed",
    cancelled: "Cancelled",
};

function toDateTimeLocal(value) {
    if (!value) return "";
    const date = new Date(value);
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function getErrorMessage(error, fallback) {
    return error.response?.data?.message || error.message || fallback;
}

function formatDate(value) {
    if (!value) return "—";

    return new Date(value).toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short",
    });
}

export default function ManageExaminations() {
    const [examinations, setExaminations] = useState([]);
    const [courses, setCourses] = useState([]);
    const [examiners, setExaminers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [confirmation, setConfirmation] = useState({
        open: false,
        exam: null,
        action: "",
    });

    const loadData = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const [examResult, courseResult, examinerResult] =
                await Promise.all([
                    api.get("/examinations"),
                    api.get("/courses"),
                    api.get("/admin/examiners/approved"),
                ]);

            setExaminations(examResult.data.examinations || []);
            setCourses(
                (courseResult.data.courses || []).filter(
                    (course) => course.isActive !== false
                )
            );
            setExaminers(examinerResult.data.examiners || []);
        } catch (err) {
            setError(
                getErrorMessage(
                    err,
                    "Unable to load examinations. Please refresh and try again."
                )
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const updateField = (event) => {
        const { name, value } = event.target;
        setForm((current) => ({ ...current, [name]: value }));
    };

    const resetForm = () => {
        setForm(emptyForm);
        setEditingId(null);
        setShowForm(false);
    };

    const startCreate = () => {
        setNotice("");
        setError("");
        setForm(emptyForm);
        setEditingId(null);
        setShowForm(true);
    };

    const startEdit = (exam) => {
        setNotice("");
        setError("");

        setForm({
            title: exam.title || "",
            description: exam.description || "",
            course: typeof exam.course === "object"
                ? exam.course?._id || ""
                : exam.course || "",
            examinationType: exam.examinationType || "viva",
            examiners: (exam.examiners || []).map((person) =>
                typeof person === "object" ? person._id : person
            ),
            bookingStart: toDateTimeLocal(exam.bookingStart),
            bookingEnd: toDateTimeLocal(exam.bookingEnd),
            examinationStart: toDateTimeLocal(exam.examinationStart),
            examinationEnd: toDateTimeLocal(exam.examinationEnd),
            durationMinutes: exam.durationMinutes || 30,
        });

        setEditingId(exam._id);
        setShowForm(true);
    };

    const validateForm = () => {
        if (!form.title.trim()) return "Enter an examination title.";
        if (!form.course) return "Select a course.";
        if (!form.bookingStart || !form.bookingEnd ||
            !form.examinationStart || !form.examinationEnd) {
            return "Complete all four date and time fields.";
        }

        const bookingStart = new Date(form.bookingStart);
        const bookingEnd = new Date(form.bookingEnd);
        const examinationStart = new Date(form.examinationStart);
        const examinationEnd = new Date(form.examinationEnd);

        if (bookingStart >= bookingEnd) {
            return "Booking start must be before booking end.";
        }
        if (bookingEnd > examinationStart) {
            return "Booking must close before the examination begins.";
        }
        if (examinationStart >= examinationEnd) {
            return "Examination start must be before examination end.";
        }

        const duration = Number(form.durationMinutes);

        if (!Number.isInteger(duration) || duration < 5 || duration > 480) {
            return "Duration must be between 5 and 480 minutes.";
        }

        return "";
    };

    const submitForm = async (event) => {
        event.preventDefault();
        setError("");
        setNotice("");

        const validationError = validateForm();

        if (validationError) {
            setError(validationError);
            return;
        }

        const payload = {
            title: form.title.trim(),
            description: form.description.trim(),
            course: form.course,
            examinationType: form.examinationType,
            examiners: form.examiners,
            bookingStart: new Date(form.bookingStart).toISOString(),
            bookingEnd: new Date(form.bookingEnd).toISOString(),
            examinationStart: new Date(form.examinationStart).toISOString(),
            examinationEnd: new Date(form.examinationEnd).toISOString(),
            durationMinutes: Number(form.durationMinutes),
        };

        setSaving(true);

        try {
            if (editingId) {
                await api.patch(`/examinations/${editingId}`, payload);
                setNotice("Examination updated successfully.");
            } else {
                await api.post("/examinations", payload);
                setNotice("Examination created successfully as a draft.");
            }

            resetForm();
            await loadData();
        } catch (err) {
            setError(
                getErrorMessage(err, "Unable to save the examination.")
            );
        } finally {
            setSaving(false);
        }
    };

    const requestAction = (exam, action) => {
        setError("");
        setNotice("");

        setConfirmation({
            open: true,
            exam,
            action,
        });
    };

    const performAction = async () => {
        const { exam, action } = confirmation;

        if (!exam || !action) return;

        setError("");
        setNotice("");

        try {
            const response = await api.patch(
                `/examinations/${exam._id}/${action}`
            );

            setNotice(
                response.data.message ||
                `Examination ${action === "publish"
                    ? "published"
                    : action === "cancel"
                        ? "cancelled"
                        : "marked as completed"
                } successfully.`
            );

            setConfirmation({
                open: false,
                exam: null,
                action: "",
            });

            await loadData();
        } catch (err) {
            setError(
                getErrorMessage(
                    err,
                    `Unable to ${action} the examination.`
                )
            );
        }
    };

    const filteredExaminations = examinations.filter((exam) => {
        const query = search.trim().toLowerCase();

        const matchesSearch =
            !query ||
            exam.title?.toLowerCase().includes(query) ||
            exam.course?.title?.toLowerCase().includes(query) ||
            exam.course?.courseCode?.toLowerCase().includes(query) ||
            exam.examinationType?.toLowerCase().includes(query);

        const matchesStatus =
            statusFilter === "all" || exam.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const stats = {
        total: examinations.length,
        draft: examinations.filter((exam) => exam.status === "draft").length,
        published: examinations.filter((exam) => exam.status === "published").length,
        completed: examinations.filter((exam) => exam.status === "completed").length,
    };

    return (
        <div className="examinations-page">
            <div className="examinations-heading">
                <div>
                    <p className="examinations-eyebrow">ADMINISTRATION</p>
                    <h1>Manage Examinations</h1>
                    <p className="examinations-subtitle">
                        Create examination schedules, assign examiners, and manage publication.
                    </p>
                </div>

                <div className="examinations-heading-actions">
                    <button
                        type="button"
                        className="exam-btn exam-btn-secondary"
                        onClick={loadData}
                        disabled={loading}
                    >
                        <RefreshCw size={16} />
                        Refresh
                    </button>

                    <button
                        type="button"
                        className="exam-btn exam-btn-primary"
                        onClick={startCreate}
                    >
                        <Plus size={17} />
                        New Examination
                    </button>
                </div>
            </div>

            {error && (
                <div className="exam-alert exam-alert-error" role="alert">
                    {error}
                    <button
                        type="button"
                        aria-label="Dismiss error"
                        onClick={() => setError("")}
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            {notice && (
                <div className="exam-alert exam-alert-success" role="status">
                    {notice}
                    <button
                        type="button"
                        aria-label="Dismiss message"
                        onClick={() => setNotice("")}
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            <div className="exam-stats-grid">
                {[
                    { label: "Total examinations", value: stats.total },
                    { label: "Draft", value: stats.draft },
                    { label: "Published", value: stats.published },
                    { label: "Completed", value: stats.completed },
                ].map((stat) => (
                    <div className="exam-stat-card" key={stat.label}>
                        <span>{stat.label}</span>
                        <strong>{stat.value}</strong>
                    </div>
                ))}
            </div>

            {showForm && (
                <section className="exam-form-panel">
                    <div className="exam-form-heading">
                        <div>
                            <h2>{editingId ? "Edit Examination" : "Create Examination"}</h2>
                            <p>
                                {editingId
                                    ? "Update the examination details."
                                    : "New examinations are saved as drafts until published."}
                            </p>
                        </div>

                        <button
                            type="button"
                            className="exam-icon-btn"
                            onClick={resetForm}
                            aria-label="Close form"
                        >
                            <X size={19} />
                        </button>
                    </div>

                    <form onSubmit={submitForm}>
                        <div className="exam-form-grid">
                            <label className="exam-field exam-field-full">
                                Examination title *
                                <input
                                    name="title"
                                    value={form.title}
                                    onChange={updateField}
                                    placeholder="e.g. JavaScript Practical Examination"
                                    maxLength={150}
                                    required
                                />
                            </label>

                            <label className="exam-field">
                                Course *
                                <select
                                    name="course"
                                    value={form.course}
                                    onChange={updateField}
                                    required
                                >
                                    <option value="">Select a course</option>
                                    {courses.map((course) => (
                                        <option key={course._id} value={course._id}>
                                            {course.courseCode} — {course.title}
                                        </option>
                                    ))}
                                </select>
                                {courses.length === 0 && (
                                    <small>Create and activate a course first.</small>
                                )}
                            </label>

                            <label className="exam-field">
                                Examination type *
                                <select
                                    name="examinationType"
                                    value={form.examinationType}
                                    onChange={updateField}
                                    required
                                >
                                    {Object.entries(typeLabels).map(([value, label]) => (
                                        <option key={value} value={value}>{label}</option>
                                    ))}
                                </select>
                            </label>

                            <label className="exam-field exam-field-full">
                                Description
                                <textarea
                                    name="description"
                                    value={form.description}
                                    onChange={updateField}
                                    rows={3}
                                    placeholder="Optional examination instructions"
                                    maxLength={2000}
                                />
                            </label>

                            <label className="exam-field exam-field-full">
                                Assign examiners
                                <select
                                    multiple
                                    value={form.examiners}
                                    onChange={(event) => {
                                        const selected = Array.from(
                                            event.target.selectedOptions,
                                            (option) => option.value
                                        );
                                        setForm((current) => ({
                                            ...current,
                                            examiners: selected,
                                        }));
                                    }}
                                    size={Math.min(Math.max(examiners.length, 2), 5)}
                                >
                                    {examiners.map((examiner) => (
                                        <option key={examiner._id} value={examiner._id}>
                                            {examiner.fullName} — {examiner.email}
                                        </option>
                                    ))}
                                </select>
                                <small>
                                    Hold Ctrl (Windows/Linux) or Command (Mac) to select multiple examiners.
                                    At least one examiner is required before publishing.
                                </small>
                                {examiners.length === 0 && (
                                    <small>No approved, active examiners are available.</small>
                                )}
                            </label>

                            <label className="exam-field">
                                Booking starts *
                                <input
                                    type="datetime-local"
                                    name="bookingStart"
                                    value={form.bookingStart}
                                    onChange={updateField}
                                    required
                                />
                            </label>

                            <label className="exam-field">
                                Booking closes *
                                <input
                                    type="datetime-local"
                                    name="bookingEnd"
                                    value={form.bookingEnd}
                                    onChange={updateField}
                                    required
                                />
                            </label>

                            <label className="exam-field">
                                Examination starts *
                                <input
                                    type="datetime-local"
                                    name="examinationStart"
                                    value={form.examinationStart}
                                    onChange={updateField}
                                    required
                                />
                            </label>

                            <label className="exam-field">
                                Examination ends *
                                <input
                                    type="datetime-local"
                                    name="examinationEnd"
                                    value={form.examinationEnd}
                                    onChange={updateField}
                                    required
                                />
                            </label>

                            <label className="exam-field">
                                Duration (minutes) *
                                <input
                                    type="number"
                                    name="durationMinutes"
                                    value={form.durationMinutes}
                                    onChange={updateField}
                                    min="5"
                                    max="480"
                                    step="1"
                                    required
                                />
                                <small>Enter a value between 5 and 480 minutes.</small>
                            </label>
                        </div>

                        <div className="exam-form-actions">
                            <button
                                type="button"
                                className="exam-btn exam-btn-secondary"
                                onClick={resetForm}
                                disabled={saving}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="exam-btn exam-btn-primary"
                                disabled={saving}
                            >
                                {saving
                                    ? "Saving..."
                                    : editingId
                                        ? "Save Changes"
                                        : "Create Draft"}
                            </button>
                        </div>
                    </form>
                </section>
            )}

            <section className="exam-list-panel">
                <div className="exam-list-heading">
                    <div>
                        <h2>All Examinations</h2>
                        <p>{filteredExaminations.length} examination(s) found</p>
                    </div>
                </div>

                <div className="exam-toolbar">
                    <div className="exam-search">
                        <Search size={17} />
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search title, course, or type..."
                            aria-label="Search examinations"
                        />
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(event) => setStatusFilter(event.target.value)}
                        aria-label="Filter by status"
                    >
                        <option value="all">All statuses</option>
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>

                {loading ? (
                    <div className="exam-empty-state">
                        <RefreshCw className="exam-spinner" size={25} />
                        <p>Loading examinations...</p>
                    </div>
                ) : filteredExaminations.length === 0 ? (
                    <div className="exam-empty-state">
                        <CalendarDays size={32} />
                        <h3>No examinations found</h3>
                        <p>
                            {examinations.length === 0
                                ? "Create your first examination to get started."
                                : "Try changing the search term or status filter."}
                        </p>
                    </div>
                ) : (
                    <div className="exam-table-wrap">
                        <table className="exam-table">
                            <thead>
                                <tr>
                                    <th>Examination</th>
                                    <th>Course</th>
                                    <th>Type</th>
                                    <th>Schedule</th>
                                    <th>Status</th>
                                    <th>Examiners</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredExaminations.map((exam) => {
                                    const editable = !["completed", "cancelled"].includes(exam.status);
                                    const canEditSchedule = exam.status !== "published";

                                    return (
                                        <tr key={exam._id}>
                                            <td>
                                                <div className="exam-title-cell">
                                                    <strong>{exam.title}</strong>
                                                    <span>{exam.description || "No description"}</span>
                                                </div>
                                            </td>

                                            <td>
                                                <div className="exam-course-cell">
                                                    <strong>{exam.course?.courseCode || "—"}</strong>
                                                    <span>{exam.course?.title || "Course unavailable"}</span>
                                                </div>
                                            </td>

                                            <td>
                                                <span className="exam-type-tag">
                                                    {typeLabels[exam.examinationType] || exam.examinationType}
                                                </span>
                                            </td>

                                            <td>
                                                <div className="exam-schedule-cell">
                                                    <span>
                                                        <CalendarDays size={14} />
                                                        {formatDate(exam.examinationStart)}
                                                    </span>
                                                    <span>
                                                        <Clock size={14} />
                                                        {exam.durationMinutes} min
                                                    </span>
                                                </div>
                                            </td>

                                            <td>
                                                <span className={`exam-status exam-status-${exam.status}`}>
                                                    {statusLabels[exam.status] || exam.status}
                                                </span>
                                            </td>

                                            <td>
                                                <span className="exam-examiner-count">
                                                    <Users size={15} />
                                                    {exam.examiners?.length || 0}
                                                </span>
                                            </td>

                                            <td>
                                                <div className="exam-row-actions">
                                                    {editable && (
                                                        <button
                                                            type="button"
                                                            className="exam-action-btn"
                                                            title={
                                                                canEditSchedule
                                                                    ? "Edit examination"
                                                                    : "Published examinations cannot have their schedule changed"
                                                            }
                                                            onClick={() => startEdit(exam)}
                                                        >
                                                            <Pencil size={15} />
                                                            Edit
                                                        </button>
                                                    )}

                                                    {exam.status === "draft" && (
                                                        <button
                                                            type="button"
                                                            className="exam-action-btn exam-action-publish"
                                                            onClick={() => requestAction(exam, "publish")}
                                                            title="Publish examination"
                                                        >
                                                            <Send size={15} />
                                                            Publish
                                                        </button>
                                                    )}

                                                    {["draft", "published"].includes(exam.status) && (
                                                        <button
                                                            type="button"
                                                            className="exam-action-btn exam-action-cancel"
                                                            onClick={() => requestAction(exam, "cancel")}
                                                            title="Cancel examination"
                                                        >
                                                            <Ban size={15} />
                                                            Cancel
                                                        </button>
                                                    )}

                                                    {exam.status === "published" && (
                                                        <button
                                                            type="button"
                                                            className="exam-action-btn exam-action-complete"
                                                            onClick={() => requestAction(exam, "complete")}
                                                            title="Mark examination as completed"
                                                        >
                                                            <CheckCircle size={15} />
                                                            Mark Completed
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
            <ConfirmDialog
                open={confirmation.open}
                title={
                    confirmation.action === "publish"
                        ? "Publish examination?"
                        : confirmation.action === "cancel"
                            ? "Cancel examination?"
                            : "Complete examination?"
                }
                message={
                    confirmation.action === "publish"
                        ? `Publish "${confirmation.exam?.title}"? Students will be able to book it according to the booking schedule.`
                        : confirmation.action === "cancel"
                            ? `Are you sure you want to cancel "${confirmation.exam?.title}"?`
                            : `Mark "${confirmation.exam?.title}" as completed? Examiners will then be able to submit evaluations.`
                }
                confirmText={
                    confirmation.action === "publish"
                        ? "Publish"
                        : confirmation.action === "cancel"
                            ? "Yes, Cancel"
                            : "Mark Completed"
                }
                danger={confirmation.action === "cancel"}
                onConfirm={performAction}
                onCancel={() =>
                    setConfirmation({
                        open: false,
                        exam: null,
                        action: "",
                    })
                }
            />
        </div>
    );
}