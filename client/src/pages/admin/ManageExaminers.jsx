import { useCallback, useEffect, useState } from "react";
import ConfirmDialog from "../../components/ConfirmDialog";
import {
    Users,
    Mail,
    Building2,
    CheckCircle2,
    XCircle,
    Clock,
    RefreshCw,
    UserRoundCheck,
    X,
} from "lucide-react";
import api from "../../services/api";

function getErrorMessage(error) {
    return (
        error.response?.data?.message ||
        error.message ||
        "Something went wrong. Please try again."
    );
}

function formatDate(date) {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return "—";

    return parsedDate.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

function getInitials(name = "") {
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || "")
        .join("");
}

export default function ManageExaminers() {
    const [pendingExaminers, setPendingExaminers] = useState([]);
    const [approvedExaminers, setApprovedExaminers] = useState([]);

    const [activeTab, setActiveTab] = useState("pending");
    const [loading, setLoading] = useState(true);
    const [actionId, setActionId] = useState(null);
    const [processingAction, setProcessingAction] = useState(null);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [search, setSearch] = useState("");
    const [confirmationOpen, setConfirmationOpen] = useState(false);
    const [selectedExaminer, setSelectedExaminer] = useState(null);
    const [rejecting, setRejecting] = useState(false);

    const loadExaminers = useCallback(async (tab = activeTab) => {
        setLoading(true);
        setError("");

        try {
            if (tab === "pending") {
                const response = await api.get(
                    "/admin/examiners/pending"
                );

                const list = response.data?.examiners;

                if (!Array.isArray(list)) {
                    throw new Error(
                        "The server returned an unexpected pending examiner list."
                    );
                }

                setPendingExaminers(list);
            } else {
                const response = await api.get(
                    "/admin/examiners/approved"
                );

                const list = response.data?.examiners;

                if (!Array.isArray(list)) {
                    throw new Error(
                        "The server returned an unexpected approved examiner list."
                    );
                }

                setApprovedExaminers(list);
            }
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, [activeTab]);

    useEffect(() => {
        loadExaminers(activeTab);
    }, [activeTab, loadExaminers]);

    const handleTabChange = (tab) => {
        setSearch("");
        setError("");
        setSuccess("");
        setActiveTab(tab);
    };

    const requestReject = (examiner) => {
        setError("");
        setSuccess("");
        setSelectedExaminer(examiner);
        setConfirmationOpen(true);
    };

    const handleAction = async (examiner, action) => {
        const isApprove = action === "approve";

        setError("");
        setSuccess("");
        setActionId(examiner._id);
        setProcessingAction(action);

        try {
            const response = await api.patch(
                `/admin/examiners/${examiner._id}/${action}`
            );

            if (!response.data?.success) {
                throw new Error(
                    response.data?.message ||
                    "The action could not be completed."
                );
            }

            setPendingExaminers((previous) =>
                previous.filter((item) => item._id !== examiner._id)
            );

            if (isApprove) {
                const approvedExaminer = response.data?.examiner;

                if (approvedExaminer?._id) {
                    setApprovedExaminers((previous) => {
                        const alreadyExists = previous.some(
                            (item) => item._id === approvedExaminer._id
                        );

                        return alreadyExists
                            ? previous
                            : [...previous, approvedExaminer].sort(
                                (a, b) =>
                                    (a.fullName || "").localeCompare(
                                        b.fullName || ""
                                    )
                            );
                    });
                }

                setSuccess(
                    response.data.message ||
                    "Examiner approved successfully."
                );
            } else {
                setSuccess(
                    response.data.message ||
                    "Examiner registration rejected."
                );

                setConfirmationOpen(false);
                setSelectedExaminer(null);
            }
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setActionId(null);
            setProcessingAction(null);
            setRejecting(false);
        }
    };

    const confirmReject = async () => {
        if (!selectedExaminer || rejecting) return;

        setRejecting(true);
        await handleAction(selectedExaminer, "reject");
    };

    const examiners =
        activeTab === "pending"
            ? pendingExaminers
            : approvedExaminers;

    const filteredExaminers = examiners.filter((examiner) => {
        const query = search.trim().toLowerCase();

        if (!query) return true;

        return [
            examiner.fullName,
            examiner.email,
            examiner.department,
        ].some((value) =>
            String(value || "").toLowerCase().includes(query)
        );
    });

    return (
        <section className="examiners-page">
            <header className="examiners-heading">
                <div>
                    <span className="examiners-eyebrow">
                        USER MANAGEMENT
                    </span>
                    <h1>Manage Examiners</h1>
                    <p>
                        Review examiner registrations and manage approved examiners.
                    </p>
                </div>

                <button
                    type="button"
                    className="examiners-refresh-button"
                    onClick={() => loadExaminers(activeTab)}
                    disabled={loading || actionId !== null}
                >
                    <RefreshCw
                        size={17}
                        className={loading ? "examiners-spinning" : ""}
                    />
                    Refresh
                </button>
            </header>

            {error && (
                <div
                    className="examiners-alert examiners-alert-error"
                    role="alert"
                >
                    <span>{error}</span>
                    <button
                        type="button"
                        onClick={() => setError("")}
                        aria-label="Dismiss error"
                    >
                        <X size={17} />
                    </button>
                </div>
            )}

            {success && (
                <div
                    className="examiners-alert examiners-alert-success"
                    role="status"
                >
                    <CheckCircle2 size={18} />
                    <span>{success}</span>
                    <button
                        type="button"
                        onClick={() => setSuccess("")}
                        aria-label="Dismiss message"
                    >
                        <X size={17} />
                    </button>
                </div>
            )}

            <div className="examiners-summary">
                <article className="examiners-summary-card">
                    <span className="examiners-summary-icon">
                        <Clock size={22} />
                    </span>
                    <div>
                        <p>Pending Approval</p>
                        <h2>{pendingExaminers.length}</h2>
                    </div>
                </article>

                <article className="examiners-summary-card">
                    <span className="examiners-summary-icon examiners-review-icon">
                        <UserRoundCheck size={22} />
                    </span>
                    <div>
                        <p>Approved Examiners</p>
                        <h2>{approvedExaminers.length}</h2>
                    </div>
                </article>

                <article className="examiners-summary-card">
                    <span className="examiners-summary-icon">
                        <Users size={22} />
                    </span>
                    <div>
                        <p>Currently Displayed</p>
                        <h2>{filteredExaminers.length}</h2>
                    </div>
                </article>
            </div>

            <div className="examiners-list-card">
                <div className="examiner-tabs">
                    <button
                        type="button"
                        className={
                            activeTab === "pending"
                                ? "examiner-tab active"
                                : "examiner-tab"
                        }
                        onClick={() => handleTabChange("pending")}
                    >
                        <Clock size={16} />
                        Pending Approval
                        <span>{pendingExaminers.length}</span>
                    </button>

                    <button
                        type="button"
                        className={
                            activeTab === "approved"
                                ? "examiner-tab active"
                                : "examiner-tab"
                        }
                        onClick={() => handleTabChange("approved")}
                    >
                        <UserRoundCheck size={16} />
                        Approved Examiners
                        <span>{approvedExaminers.length}</span>
                    </button>
                </div>

                <div className="examiners-list-heading">
                    <div>
                        <h2>
                            {activeTab === "pending"
                                ? "Pending Registrations"
                                : "Approved Examiners"}
                        </h2>
                        <p>
                            {activeTab === "pending"
                                ? "Review applications and approve eligible examiners."
                                : "View examiners who have been approved to use the examiner portal."}
                        </p>
                    </div>

                    <span className="examiners-count-badge">
                        {examiners.length}{" "}
                        {activeTab === "pending" ? "pending" : "approved"}
                    </span>
                </div>

                <div className="examiners-toolbar">
                    <input
                        type="search"
                        placeholder="Search by name, email, or department..."
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        aria-label="Search examiners"
                    />
                </div>

                {loading ? (
                    <div className="examiners-empty-state">
                        <RefreshCw
                            size={28}
                            className="examiners-spinning"
                        />
                        <p>Loading examiners...</p>
                    </div>
                ) : filteredExaminers.length === 0 ? (
                    <div className="examiners-empty-state">
                        {search.trim() ? (
                            <>
                                <Users size={35} />
                                <h3>No matching examiners</h3>
                                <p>
                                    Try a different name, email, or department.
                                </p>
                            </>
                        ) : activeTab === "pending" ? (
                            <>
                                <CheckCircle2 size={38} />
                                <h3>You're all caught up!</h3>
                                <p>
                                    There are no pending examiner registrations to review.
                                </p>
                            </>
                        ) : (
                            <>
                                <UserRoundCheck size={38} />
                                <h3>No approved examiners yet</h3>
                                <p>
                                    Approved examiners will appear here after their
                                    registrations are accepted.
                                </p>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="examiners-table-wrap">
                        <table className="examiners-table">
                            <thead>
                                <tr>
                                    <th>Examiner</th>
                                    <th>Department</th>
                                    <th>Registered</th>
                                    <th>Status</th>
                                    {activeTab === "pending" && (
                                        <th>Actions</th>
                                    )}
                                </tr>
                            </thead>

                            <tbody>
                                {filteredExaminers.map((examiner) => (
                                    <tr key={examiner._id}>
                                        <td>
                                            <div className="examiners-person">
                                                <span className="examiners-avatar">
                                                    {getInitials(examiner.fullName)}
                                                </span>

                                                <div>
                                                    <strong>
                                                        {examiner.fullName}
                                                    </strong>
                                                    <span className="examiners-email">
                                                        <Mail size={13} />
                                                        {examiner.email}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        <td>
                                            <span className="examiners-department">
                                                <Building2 size={15} />
                                                {examiner.department ||
                                                    "Not specified"}
                                            </span>
                                        </td>

                                        <td>{formatDate(examiner.createdAt)}</td>

                                        <td>
                                            {activeTab === "pending" ? (
                                                <span className="examiners-pending-status">
                                                    <Clock size={13} />
                                                    Pending
                                                </span>
                                            ) : (
                                                <span className="examiner-approved-status">
                                                    <CheckCircle2 size={13} />
                                                    Approved
                                                </span>
                                            )}
                                        </td>

                                        {activeTab === "pending" && (
                                            <td>
                                                <div className="examiners-actions">
                                                    <button
                                                        type="button"
                                                        className="examiners-approve-button"
                                                        onClick={() =>
                                                            requestReject(
                                                                examiner
                                                            )
                                                        }
                                                        disabled={actionId !== null}
                                                    >
                                                        {actionId === examiner._id &&
                                                            processingAction === "approve" ? (
                                                            <RefreshCw
                                                                size={15}
                                                                className="examiners-spinning"
                                                            />
                                                        ) : (
                                                            <CheckCircle2 size={15} />
                                                        )}
                                                        Approve
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="examiners-reject-button"
                                                        onClick={() =>
                                                            handleAction(
                                                                examiner,
                                                                "reject"
                                                            )
                                                        }
                                                        disabled={actionId !== null}
                                                    >
                                                        {actionId === examiner._id &&
                                                            processingAction === "reject" ? (
                                                            <RefreshCw
                                                                size={15}
                                                                className="examiners-spinning"
                                                            />
                                                        ) : (
                                                            <XCircle size={15} />
                                                        )}
                                                        Reject
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {!loading && filteredExaminers.length > 0 && (
                    <footer className="examiners-list-footer">
                        Showing {filteredExaminers.length} of {examiners.length}{" "}
                        {activeTab === "pending"
                            ? "pending applications"
                            : "approved examiners"}
                    </footer>
                )}
            </div>
            <ConfirmDialog
                open={confirmationOpen}
                title="Reject examiner registration?"
                message={`Are you sure you want to reject the examiner registration for "${selectedExaminer?.fullName || "this examiner"}"? They will not be able to sign in as an examiner.`}
                confirmText="Reject Examiner"
                cancelText="Keep Application"
                danger
                loading={rejecting}
                onConfirm={confirmReject}
                onCancel={() => {
                    if (rejecting) return;

                    setConfirmationOpen(false);
                    setSelectedExaminer(null);
                }}
            />
        </section>
    );
}
