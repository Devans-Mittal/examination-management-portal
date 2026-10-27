import { useEffect, useState } from "react";
import ConfirmDialog from "../../components/ConfirmDialog";
import {
    CalendarDays,
    Clock3,
    BookOpen,
    TicketCheck,
    CheckCircle2,
    XCircle,
    AlertCircle,
    LoaderCircle,
    RefreshCw,
    Search,
    Ban,
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

function formatTime(date) {
    if (!date) return "Not specified";

    return new Date(date).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

function getStatusClass(status) {
    switch (status) {
        case "booked":
            return "my-booking-status-booked";
        case "completed":
            return "my-booking-status-completed";
        case "cancelled":
            return "my-booking-status-cancelled";
        default:
            return "";
    }
}

function getStatusLabel(status) {
    if (!status) return "Unknown";
    return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function MyBookings() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cancellingId, setCancellingId] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");
    const [confirmationOpen, setConfirmationOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);

    const loadBookings = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await api.get("/bookings/my-bookings");
            setBookings(response.data.data || []);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to load your bookings. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBookings();
    }, []);

    const requestCancel = (booking) => {
        setError("");
        setSuccess("");
        setSelectedBooking(booking);
        setConfirmationOpen(true);
    };

    const handleCancel = async () => {
        if (!selectedBooking) return;

        const booking = selectedBooking;

        setCancellingId(booking._id);
        setError("");
        setSuccess("");

        try {
            const response = await api.patch(
                `/bookings/${booking._id}/cancel`
            );

            setSuccess(
                response.data.message || "Booking cancelled successfully."
            );

            setConfirmationOpen(false);
            setSelectedBooking(null);

            await loadBookings();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to cancel this booking. Please try again."
            );
        } finally {
            setCancellingId("");
        }
    };

    const activeCount = bookings.filter(
        (booking) => booking.status === "booked"
    ).length;

    const completedCount = bookings.filter(
        (booking) => booking.status === "completed"
    ).length;

    const cancelledCount = bookings.filter(
        (booking) => booking.status === "cancelled"
    ).length;

    const filteredBookings = bookings.filter((booking) => {
        const exam = booking.examination || {};
        const course = exam.course || {};

        const query = search.trim().toLowerCase();

        const matchesSearch =
            (exam.title || "").toLowerCase().includes(query) ||
            (course.title || "").toLowerCase().includes(query) ||
            (course.courseCode || "").toLowerCase().includes(query) ||
            (exam.examinationType || "").toLowerCase().includes(query);

        const matchesFilter =
            filter === "all" || booking.status === filter;

        return matchesSearch && matchesFilter;
    });

    if (loading) {
        return (
            <div className="my-bookings-loading">
                <LoaderCircle className="my-bookings-spin" size={30} />
                <p>Loading your bookings...</p>
            </div>
        );
    }

    return (
        <div className="my-bookings-page">
            <header className="my-bookings-header">
                <div>
                    <span className="my-bookings-eyebrow">
                        STUDENT PORTAL
                    </span>

                    <h1>My Bookings</h1>

                    <p>
                        View your examination schedule and manage your reservations.
                    </p>
                </div>

                <button
                    type="button"
                    className="my-bookings-refresh"
                    onClick={loadBookings}
                    disabled={loading}
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </header>

            {error && (
                <div className="my-bookings-alert error">
                    <AlertCircle size={19} />
                    <span>{error}</span>
                </div>
            )}

            {success && (
                <div className="my-bookings-alert success">
                    <CheckCircle2 size={19} />
                    <span>{success}</span>
                </div>
            )}

            <div className="my-bookings-stats">
                <div className="my-bookings-stat">
                    <div className="my-bookings-stat-icon">
                        <TicketCheck size={21} />
                    </div>

                    <div>
                        <span>Active Bookings</span>
                        <strong>{activeCount}</strong>
                    </div>
                </div>

                <div className="my-bookings-stat">
                    <div className="my-bookings-stat-icon">
                        <CheckCircle2 size={21} />
                    </div>

                    <div>
                        <span>Completed</span>
                        <strong>{completedCount}</strong>
                    </div>
                </div>

                <div className="my-bookings-stat">
                    <div className="my-bookings-stat-icon">
                        <XCircle size={21} />
                    </div>

                    <div>
                        <span>Cancelled</span>
                        <strong>{cancelledCount}</strong>
                    </div>
                </div>
            </div>

            <section className="my-bookings-panel">
                <div className="my-bookings-toolbar">
                    <div className="my-bookings-search">
                        <Search size={17} />

                        <input
                            type="search"
                            placeholder="Search examinations or courses..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                    </div>

                    <select
                        aria-label="Filter bookings by status"
                        value={filter}
                        onChange={(event) => setFilter(event.target.value)}
                    >
                        <option value="all">All bookings</option>
                        <option value="booked">Active</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>

                {filteredBookings.length === 0 ? (
                    <div className="my-bookings-empty">
                        <div className="my-bookings-empty-icon">
                            <CalendarDays size={30} />
                        </div>

                        <h3>
                            {bookings.length === 0
                                ? "No bookings yet"
                                : "No matching bookings"}
                        </h3>

                        <p>
                            {bookings.length === 0
                                ? "Your examination reservations will appear here after you book a slot."
                                : "Try a different search term or status filter."}
                        </p>
                    </div>
                ) : (
                    <div className="my-bookings-list">
                        {filteredBookings.map((booking) => {
                            const exam = booking.examination || {};
                            const slot = booking.slot || {};
                            const course = exam.course || {};

                            const canCancel =
                                booking.status === "booked" &&
                                slot.startTime &&
                                new Date(slot.startTime) > new Date();

                            const isCancelling =
                                cancellingId === booking._id;

                            return (
                                <article
                                    className="my-booking-card"
                                    key={booking._id}
                                >
                                    <div className="my-booking-main">
                                        <div className="my-booking-icon">
                                            <BookOpen size={23} />
                                        </div>

                                        <div className="my-booking-info">
                                            <div className="my-booking-title-row">
                                                <h2>
                                                    {exam.title || "Examination"}
                                                </h2>

                                                <span
                                                    className={`my-booking-status ${getStatusClass(
                                                        booking.status
                                                    )}`}
                                                >
                                                    {getStatusLabel(booking.status)}
                                                </span>
                                            </div>

                                            <p className="my-booking-course">
                                                {course.courseCode
                                                    ? `${course.courseCode} · `
                                                    : ""}
                                                {course.title || "Course not specified"}
                                            </p>

                                            <span className="my-booking-type">
                                                {(exam.examinationType || "Examination").toUpperCase()}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="my-booking-details">
                                        <div>
                                            <CalendarDays size={17} />

                                            <span>
                                                <small>Examination date</small>
                                                {formatDate(slot.startTime)}
                                            </span>
                                        </div>

                                        <div>
                                            <Clock3 size={17} />

                                            <span>
                                                <small>Time slot</small>
                                                {formatTime(slot.startTime)} –{" "}
                                                {formatTime(slot.endTime)}
                                            </span>
                                        </div>

                                        <div>
                                            <TicketCheck size={17} />

                                            <span>
                                                <small>Booking created</small>
                                                {formatDate(booking.bookedAt || booking.createdAt)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="my-booking-footer">
                                        <div className="my-booking-reference">
                                            Booking ID: {booking._id}
                                        </div>

                                        {canCancel && (
                                            <button
                                                type="button"
                                                className="my-booking-cancel"
                                                onClick={() => requestCancel(booking)}
                                                disabled={Boolean(cancellingId)}
                                            >
                                                {isCancelling ? (
                                                    <LoaderCircle
                                                        size={15}
                                                        className="my-bookings-spin"
                                                    />
                                                ) : (
                                                    <Ban size={15} />
                                                )}

                                                {isCancelling
                                                    ? "Cancelling..."
                                                    : "Cancel booking"}
                                            </button>
                                        )}
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>
            <ConfirmDialog
                open={confirmationOpen}
                title="Cancel this booking?"
                message={
                    `Are you sure you want to cancel your booking for "${selectedBooking?.examination?.title || "this examination"
                    }"? This will release your reserved seat.`
                }
                confirmText="Yes, Cancel Booking"
                cancelText="Keep Booking"
                danger
                loading={Boolean(cancellingId)}
                onConfirm={handleCancel}
                onCancel={() => {
                    if (cancellingId) return;

                    setConfirmationOpen(false);
                    setSelectedBooking(null);
                }}
            />
        </div>
    );
}
