import { useEffect, useMemo, useState } from "react";
import ConfirmDialog from "../../components/ConfirmDialog";
import {
    BookOpen,
    Plus,
    Search,
    Pencil,
    Power,
    X,
    RefreshCw,
    GraduationCap,
} from "lucide-react";
import api from "../../services/api";

const initialForm = {
    courseCode: "",
    title: "",
    description: "",
    department: "",
    credits: "3",
    semester: "1",
};

function getErrorMessage(error) {
    return (
        error.response?.data?.message ||
        error.message ||
        "Something went wrong. Please try again."
    );
}

export default function ManageCourses() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const [modalOpen, setModalOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState(null);
    const [form, setForm] = useState(initialForm);

    const [confirmationOpen, setConfirmationOpen] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [deactivating, setDeactivating] = useState(false);

    const [reactivationOpen, setReactivationOpen] = useState(false);
    const [selectedReactivationCourse, setSelectedReactivationCourse] = useState(null);
    const [reactivating, setReactivating] = useState(false);

    const loadCourses = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await api.get("/courses");
            const fetchedCourses = response.data?.courses;

            if (!Array.isArray(fetchedCourses)) {
                throw new Error("The server returned an unexpected course list.");
            }

            setCourses(fetchedCourses);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCourses();
    }, []);

    const filteredCourses = useMemo(() => {
        const query = search.trim().toLowerCase();

        return courses.filter((course) => {
            const matchesSearch =
                !query ||
                [
                    course.courseCode,
                    course.title,
                    course.department,
                    course.description,
                ].some((value) => String(value || "").toLowerCase().includes(query));

            const matchesStatus =
                statusFilter === "all" ||
                (statusFilter === "active" && course.isActive) ||
                (statusFilter === "inactive" && !course.isActive);

            return matchesSearch && matchesStatus;
        });
    }, [courses, search, statusFilter]);

    const activeCount = courses.filter((course) => course.isActive).length;
    const inactiveCount = courses.length - activeCount;

    const openCreateModal = () => {
        setEditingCourse(null);
        setForm(initialForm);
        setError("");
        setSuccess("");
        setModalOpen(true);
    };

    const openEditModal = (course) => {
        setEditingCourse(course);
        setForm({
            courseCode: course.courseCode || "",
            title: course.title || "",
            description: course.description || "",
            department: course.department || "",
            credits: String(course.credits ?? 3),
            semester: String(course.semester ?? 1),
        });
        setError("");
        setSuccess("");
        setModalOpen(true);
    };

    const closeModal = () => {
        if (saving) return;

        setModalOpen(false);
        setEditingCourse(null);
        setForm(initialForm);
    };

    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setSuccess("");

        const credits = Number(form.credits);
        const semester = Number(form.semester);

        if (!form.courseCode.trim() && !editingCourse) {
            setError("Course code is required.");
            return;
        }

        if (!form.title.trim() || !form.department.trim()) {
            setError("Course title and department are required.");
            return;
        }

        if (!Number.isInteger(credits) || credits < 1 || credits > 30) {
            setError("Credits must be a whole number between 1 and 30.");
            return;
        }

        if (!Number.isInteger(semester) || semester < 1 || semester > 12) {
            setError("Semester must be a whole number between 1 and 12.");
            return;
        }

        const payload = {
            title: form.title.trim(),
            description: form.description.trim(),
            department: form.department.trim(),
            credits,
            semester,
        };

        setSaving(true);

        try {
            if (editingCourse) {
                const response = await api.patch(
                    `/courses/${editingCourse._id}`,
                    payload
                );

                const updatedCourse = response.data?.course;

                if (!updatedCourse) {
                    throw new Error("The server did not return the updated course.");
                }

                setCourses((previous) =>
                    previous.map((course) =>
                        course._id === updatedCourse._id ? updatedCourse : course
                    )
                );

                setSuccess("Course updated successfully.");
            } else {
                const response = await api.post("/courses", {
                    ...payload,
                    courseCode: form.courseCode.trim().toUpperCase(),
                });

                const createdCourse = response.data?.course;

                if (!createdCourse) {
                    throw new Error("The server did not return the created course.");
                }

                setCourses((previous) => [createdCourse, ...previous]);
                setSuccess("Course created successfully.");
            }

            setModalOpen(false);
            setEditingCourse(null);
            setForm(initialForm);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setSaving(false);
        }
    };

    const requestDeactivate = (course) => {
        setError("");
        setSuccess("");
        setSelectedCourse(course);
        setConfirmationOpen(true);
    };

    const handleDeactivate = async () => {
        if (!selectedCourse) return;

        const course = selectedCourse;

        setDeactivating(true);
        setError("");
        setSuccess("");

        try {
            const response = await api.patch(
                `/courses/${course._id}/deactivate`
            );

            const updatedCourse = response.data?.course;

            if (!updatedCourse) {
                throw new Error("The server did not return the updated course.");
            }

            setCourses((previous) =>
                previous.map((item) =>
                    item._id === updatedCourse._id ? updatedCourse : item
                )
            );

            setSuccess(`${course.courseCode} has been deactivated.`);
            setConfirmationOpen(false);
            setSelectedCourse(null);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setDeactivating(false);
        }
    };

    const requestReactivate = (course) => {
        setError("");
        setSuccess("");
        setSelectedReactivationCourse(course);
        setReactivationOpen(true);
    };

    const handleReactivate = async () => {
        if (!selectedReactivationCourse) return;

        const course = selectedReactivationCourse;

        setReactivating(true);
        setError("");
        setSuccess("");

        try {
            const response = await api.patch(
                `/courses/${course._id}/reactivate`
            );

            const updatedCourse = response.data?.course;

            if (!updatedCourse) {
                throw new Error(
                    "The server did not return the updated course."
                );
            }

            setCourses((previous) =>
                previous.map((item) =>
                    item._id === updatedCourse._id ? updatedCourse : item
                )
            );

            setSuccess(`${course.courseCode} has been reactivated.`);
            setReactivationOpen(false);
            setSelectedReactivationCourse(null);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setReactivating(false);
        }
    };

    return (
        <section className="courses-page">
            <header className="courses-heading">
                <div>
                    <div className="courses-eyebrow">ACADEMIC MANAGEMENT</div>
                    <h1>Manage Courses</h1>
                    <p>Create, update, and manage academic courses.</p>
                </div>

                <button
                    type="button"
                    className="btn btn-primary courses-add-button"
                    onClick={openCreateModal}
                >
                    <Plus size={18} />
                    Add Course
                </button>
            </header>

            {error && !modalOpen && (
                <div className="courses-alert courses-alert-error" role="alert">
                    <span>{error}</span>
                    <button
                        type="button"
                        aria-label="Dismiss error"
                        onClick={() => setError("")}
                    >
                        <X size={17} />
                    </button>
                </div>
            )}

            {success && (
                <div className="courses-alert courses-alert-success" role="status">
                    <span>{success}</span>
                    <button
                        type="button"
                        aria-label="Dismiss message"
                        onClick={() => setSuccess("")}
                    >
                        <X size={17} />
                    </button>
                </div>
            )}

            <div className="courses-summary">
                <article className="courses-summary-card">
                    <span className="courses-summary-icon">
                        <BookOpen size={21} />
                    </span>
                    <div>
                        <p>Total courses</p>
                        <h2>{courses.length}</h2>
                    </div>
                </article>

                <article className="courses-summary-card">
                    <span className="courses-summary-icon courses-icon-active">
                        <GraduationCap size={21} />
                    </span>
                    <div>
                        <p>Active courses</p>
                        <h2>{activeCount}</h2>
                    </div>
                </article>

                <article className="courses-summary-card">
                    <span className="courses-summary-icon courses-icon-inactive">
                        <Power size={21} />
                    </span>
                    <div>
                        <p>Inactive courses</p>
                        <h2>{inactiveCount}</h2>
                    </div>
                </article>
            </div>

            <div className="courses-list-card">
                <div className="courses-list-heading">
                    <div>
                        <h2>Course Directory</h2>
                        <p>All courses registered in the system.</p>
                    </div>

                    <button
                        type="button"
                        className="courses-refresh-button"
                        onClick={loadCourses}
                        disabled={loading}
                        title="Refresh courses"
                        aria-label="Refresh courses"
                    >
                        <RefreshCw size={17} className={loading ? "courses-spinning" : ""} />
                    </button>
                </div>

                <div className="courses-toolbar">
                    <div className="courses-search">
                        <Search size={18} />
                        <input
                            type="search"
                            placeholder="Search code, title, or department..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            aria-label="Search courses"
                        />
                    </div>

                    <select
                        className="courses-status-filter"
                        value={statusFilter}
                        onChange={(event) => setStatusFilter(event.target.value)}
                        aria-label="Filter courses by status"
                    >
                        <option value="all">All courses</option>
                        <option value="active">Active only</option>
                        <option value="inactive">Inactive only</option>
                    </select>
                </div>

                {loading ? (
                    <div className="courses-empty-state">
                        <RefreshCw size={27} className="courses-spinning" />
                        <p>Loading courses...</p>
                    </div>
                ) : courses.length === 0 ? (
                    <div className="courses-empty-state">
                        <BookOpen size={35} />
                        <h3>No courses yet</h3>
                        <p>Add your first course to get started.</p>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={openCreateModal}
                        >
                            <Plus size={17} />
                            Add Course
                        </button>
                    </div>
                ) : filteredCourses.length === 0 ? (
                    <div className="courses-empty-state">
                        <Search size={32} />
                        <h3>No matching courses</h3>
                        <p>Try another search term or status filter.</p>
                    </div>
                ) : (
                    <>
                        <div className="courses-table-wrap">
                            <table className="courses-table">
                                <thead>
                                    <tr>
                                        <th>Course</th>
                                        <th>Department</th>
                                        <th>Credits</th>
                                        <th>Semester</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredCourses.map((course) => (
                                        <tr key={course._id}>
                                            <td>
                                                <div className="courses-course-cell">
                                                    <span className="courses-course-icon">
                                                        <BookOpen size={19} />
                                                    </span>
                                                    <div>
                                                        <strong>{course.courseCode}</strong>
                                                        <span>{course.title}</span>
                                                    </div>
                                                </div>
                                            </td>

                                            <td>{course.department}</td>
                                            <td>{course.credits}</td>
                                            <td>{course.semester}</td>

                                            <td>
                                                <span
                                                    className={`courses-status ${course.isActive
                                                        ? "courses-status-active"
                                                        : "courses-status-inactive"
                                                        }`}
                                                >
                                                    {course.isActive ? "Active" : "Inactive"}
                                                </span>
                                            </td>

                                            <td>
                                                <div className="courses-actions">
                                                    <button
                                                        type="button"
                                                        className="courses-action-button"
                                                        title="Edit course"
                                                        aria-label={`Edit ${course.courseCode}`}
                                                        onClick={() => openEditModal(course)}
                                                    >
                                                        <Pencil size={16} />
                                                    </button>

                                                    {course.isActive ? (
                                                        <button
                                                            type="button"
                                                            className="courses-action-button courses-deactivate-button"
                                                            title="Deactivate course"
                                                            aria-label={`Deactivate ${course.courseCode}`}
                                                            onClick={() => requestDeactivate(course)}
                                                        >
                                                            <Power size={16} />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            className="courses-action-button courses-reactivate-button"
                                                            title="Reactivate course"
                                                            aria-label={`Reactivate ${course.courseCode}`}
                                                            onClick={() => requestReactivate(course)}
                                                        >
                                                            <RefreshCw size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="courses-table-footer">
                            Showing {filteredCourses.length} of {courses.length} courses
                        </div>
                    </>
                )}
            </div>

            {modalOpen && (
                <div
                    className="courses-modal-backdrop"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) closeModal();
                    }}
                >
                    <section
                        className="courses-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="courses-modal-title"
                    >
                        <div className="courses-modal-heading">
                            <div>
                                <span className="courses-eyebrow">
                                    COURSE INFORMATION
                                </span>
                                <h2 id="courses-modal-title">
                                    {editingCourse ? "Edit Course" : "Add New Course"}
                                </h2>
                                <p>
                                    {editingCourse
                                        ? "Update the course details below."
                                        : "Enter the details to register a new course."}
                                </p>
                            </div>

                            <button
                                type="button"
                                className="courses-modal-close"
                                onClick={closeModal}
                                disabled={saving}
                                aria-label="Close form"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {error && (
                            <div className="courses-alert courses-alert-error" role="alert">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="courses-form-grid">
                                <label className="courses-form-field">
                                    Course code *
                                    <input
                                        name="courseCode"
                                        value={form.courseCode}
                                        onChange={handleChange}
                                        placeholder="e.g. CS301"
                                        maxLength={20}
                                        required={!editingCourse}
                                        disabled={Boolean(editingCourse) || saving}
                                    />
                                    {editingCourse && (
                                        <small>Course codes cannot be changed.</small>
                                    )}
                                </label>

                                <label className="courses-form-field">
                                    Course title *
                                    <input
                                        name="title"
                                        value={form.title}
                                        onChange={handleChange}
                                        placeholder="e.g. Database Management Systems"
                                        maxLength={150}
                                        required
                                        disabled={saving}
                                    />
                                </label>

                                <label className="courses-form-field">
                                    Department *
                                    <input
                                        name="department"
                                        value={form.department}
                                        onChange={handleChange}
                                        placeholder="e.g. Computer Science"
                                        maxLength={100}
                                        required
                                        disabled={saving}
                                    />
                                </label>

                                <label className="courses-form-field">
                                    Credits *
                                    <input
                                        name="credits"
                                        type="number"
                                        min="1"
                                        max="30"
                                        step="1"
                                        value={form.credits}
                                        onChange={handleChange}
                                        required
                                        disabled={saving}
                                    />
                                </label>

                                <label className="courses-form-field">
                                    Semester *
                                    <select
                                        name="semester"
                                        value={form.semester}
                                        onChange={handleChange}
                                        required
                                        disabled={saving}
                                    >
                                        {Array.from({ length: 12 }, (_, index) => index + 1).map(
                                            (semester) => (
                                                <option key={semester} value={semester}>
                                                    Semester {semester}
                                                </option>
                                            )
                                        )}
                                    </select>
                                </label>

                                <label className="courses-form-field courses-description-field">
                                    Description
                                    <textarea
                                        name="description"
                                        value={form.description}
                                        onChange={handleChange}
                                        placeholder="Briefly describe the course..."
                                        maxLength={1000}
                                        rows={4}
                                        disabled={saving}
                                    />
                                    <small>{form.description.length}/1000 characters</small>
                                </label>
                            </div>

                            <div className="courses-modal-footer">
                                <button
                                    type="button"
                                    className="courses-cancel-button"
                                    onClick={closeModal}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={saving}
                                >
                                    {saving
                                        ? "Saving..."
                                        : editingCourse
                                            ? "Save Changes"
                                            : "Create Course"}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            )}
            <ConfirmDialog
                open={confirmationOpen}
                title="Deactivate this course?"
                message={
                    `Are you sure you want to deactivate "${selectedCourse?.courseCode || ""} — ${selectedCourse?.title || ""}"? The course will remain in the database but will be marked inactive.`
                }
                confirmText="Deactivate Course"
                cancelText="Keep Course Active"
                danger
                loading={deactivating}
                onConfirm={handleDeactivate}
                onCancel={() => {
                    if (deactivating) return;

                    setConfirmationOpen(false);
                    setSelectedCourse(null);
                }}
            />
            <ConfirmDialog
                open={reactivationOpen}
                title="Reactivate this course?"
                message={`Are you sure you want to reactivate "${selectedReactivationCourse?.courseCode || ""
                    } — ${selectedReactivationCourse?.title || ""
                    }"? The course will be marked active again.`}
                confirmText="Reactivate Course"
                cancelText="Keep Course Inactive"
                loading={reactivating}
                onConfirm={handleReactivate}
                onCancel={() => {
                    if (reactivating) return;

                    setReactivationOpen(false);
                    setSelectedReactivationCourse(null);
                }}
            />
        </section>
    );
}
