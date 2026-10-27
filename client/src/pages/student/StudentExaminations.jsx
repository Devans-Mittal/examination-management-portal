import { useEffect, useState } from "react";
import ConfirmDialog from "../../components/ConfirmDialog";
import {
    CalendarDays,
    Clock3,
    BookOpen,
    Users,
    CheckCircle2,
    AlertCircle,
    LoaderCircle,
    RefreshCw,
    MapPin,
    TicketCheck,
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

function formatDateTime(date) {
    if (!date) return "Not specified";
    return `${formatDate(date)} · ${formatTime(date)}`;
}

export default function StudentExaminations() {
    const [examinations, setExaminations] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [bookingSlot, setBookingSlot] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");
    const [confirmationOpen, setConfirmationOpen] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState("");

    const loadData = async () => {
        setLoading(true);
        setError("");

        try {
            const [examinationResponse, bookingResponse] = await Promise.all([
                api.get("/bookings/available-examinations"),
                api.get("/bookings/my-bookings"),
            ]);

            setExaminations(examinationResponse.data.data || []);
            setBookings(bookingResponse.data.data || []);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to load examinations. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const activeBookings = bookings.filter(
        (booking) => booking.status === "booked"
    );

    const bookedExaminationIds = new Set(
        activeBookings.map((booking) => booking.examination?._id).filter(Boolean)
    );

    const filteredExaminations = examinations.filter((exam) => {
        const query = search.trim().toLowerCase();

        const matchesSearch =
            (exam.title || "").toLowerCase().includes(query) ||
            (exam.course?.title || "").toLowerCase().includes(query) ||
            (exam.course?.courseCode || "").toLowerCase().includes(query) ||
            (exam.examinationType || "").toLowerCase().includes(query);

        const hasAvailableSlots = (exam.slots || []).some(
            (slot) => slot.availableSeats > 0
        );

        if (filter === "available" && !hasAvailableSlots) return false;
        if (filter === "booked" && !bookedExaminationIds.has(exam._id))
            return false;

        return matchesSearch;
    });

    const requestBooking = (slotId) => {
        if (!slotId) return;

        setError("");
        setSuccess("");
        setSelectedSlot(slotId);
        setConfirmationOpen(true);
    };

    const handleBooking = async () => {
        if (!selectedSlot) return;

        const slotId = selectedSlot;

        setBookingSlot(slotId);
        setError("");
        setSuccess("");

        try {
            const response = await api.post("/bookings", {
                slot: slotId,
            });

            setSuccess(
                response.data.message ||
                "Examination slot booked successfully."
            );

            setConfirmationOpen(false);
            setSelectedSlot("");

            await loadData();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to book this slot. Please try again."
            );
        } finally {
            setBookingSlot("");
        }
    };
    if (loading) {
        return (
            <div className="student-exam-loading">
                <LoaderCircle className="spin" size={30} />
                <p>Loading available examinations...</p>
            </div>
        );
    }

    return (
        <div className="student-exam-page">
            <div className="student-exam-header">
                <div>
                    <span className="student-exam-eyebrow">STUDENT PORTAL</span>
                    <h1>Available Examinations</h1>
                    <p>
                        Explore published examinations and reserve a suitable time slot.
                    </p>
                </div>

                <button
                    className="student-exam-refresh"
                    onClick={loadData}
                    disabled={loading}
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </div>

            {error && (
                <div className="student-exam-alert error">
                    <AlertCircle size={19} />
                    <span>{error}</span>
                </div>
            )}

            {success && (
                <div className="student-exam-alert success">
                    <CheckCircle2 size={19} />
                    <span>{success}</span>
                </div>
            )}

            <div className="student-exam-stats">
                <div className="student-exam-stat">
                    <div className="student-exam-stat-icon">
                        <BookOpen size={21} />
                    </div>
                    <div>
                        <span>Examinations</span>
                        <strong>{examinations.length}</strong>
                    </div>
                </div>

                <div className="student-exam-stat">
                    <div className="student-exam-stat-icon">
                        <TicketCheck size={21} />
                    </div>
                    <div>
                        <span>My Active Bookings</span>
                        <strong>{activeBookings.length}</strong>
                    </div>
                </div>

                <div className="student-exam-stat">
                    <div className="student-exam-stat-icon">
                        <Users size={21} />
                    </div>
                    <div>
                        <span>Available Slots</span>
                        <strong>
                            {examinations.reduce(
                                (total, exam) =>
                                    total +
                                    (exam.slots || []).filter(
                                        (slot) => slot.availableSeats > 0
                                    ).length,
                                0
                            )}
                        </strong>
                    </div>
                </div>
            </div>

            <div className="student-exam-toolbar">
                <input
                    type="search"
                    placeholder="Search by examination or course..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                />

                <select
                    value={filter}
                    onChange={(event) => setFilter(event.target.value)}
                    aria-label="Filter examinations"
                >
                    <option value="all">All examinations</option>
                    <option value="available">Slots available</option>
                    <option value="booked">Already booked</option>
                </select>
            </div>

            {filteredExaminations.length === 0 ? (
                <div className="student-exam-empty">
                    <div className="student-exam-empty-icon">
                        <CalendarDays size={30} />
                    </div>
                    <h3>No examinations found</h3>
                    <p>
                        {search || filter !== "all"
                            ? "Try changing your search or filter."
                            : "There are currently no examinations open for booking. Please check again later."}
                    </p>
                </div>
            ) : (
                <div className="student-exam-grid">
                    {filteredExaminations.map((exam) => {
                        const hasActiveBooking = bookedExaminationIds.has(exam._id);

                        return (
                            <article className="student-exam-card" key={exam._id}>
                                <div className="student-exam-card-top">
                                    <span className="student-exam-type">
                                        {(exam.examinationType || "Examination").toUpperCase()}
                                    </span>

                                    {hasActiveBooking ? (
                                        <span className="student-exam-booked-badge">
                                            <CheckCircle2 size={14} />
                                            Booked
                                        </span>
                                    ) : (
                                        <span className="student-exam-open-badge">Open</span>
                                    )}
                                </div>

                                <h2>{exam.title}</h2>

                                <p className="student-exam-course">
                                    {exam.course?.courseCode
                                        ? `${exam.course.courseCode} · `
                                        : ""}
                                    {exam.course?.title || "Course not specified"}
                                </p>

                                {exam.description && (
                                    <p className="student-exam-description">
                                        {exam.description}
                                    </p>
                                )}

                                <div className="student-exam-details">
                                    <div>
                                        <CalendarDays size={17} />
                                        <span>
                                            <small>Examination period</small>
                                            {formatDateTime(exam.examinationStart)}
                                        </span>
                                    </div>

                                    <div>
                                        <Clock3 size={17} />
                                        <span>
                                            <small>Booking closes</small>
                                            {formatDateTime(exam.bookingEnd)}
                                        </span>
                                    </div>

                                    {exam.examiners?.length > 0 && (
                                        <div>
                                            <Users size={17} />
                                            <span>
                                                <small>Assigned examiners</small>
                                                {exam.examiners
                                                    .map((examiner) => examiner.fullName)
                                                    .filter(Boolean)
                                                    .join(", ")}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="student-exam-slots-heading">
                                    <h3>Available Time Slots</h3>
                                    <span>{(exam.slots || []).length} slots</span>
                                </div>

                                {!exam.slots?.length ? (
                                    <p className="student-exam-no-slots">
                                        No future slots have been created for this examination.
                                    </p>
                                ) : (
                                    <div className="student-exam-slot-list">
                                        {exam.slots.map((slot) => {
                                            const isFull = slot.availableSeats <= 0;
                                            const isBusy = bookingSlot === slot._id;

                                            return (
                                                <div className="student-exam-slot" key={slot._id}>
                                                    <div className="student-exam-slot-time">
                                                        <strong>{formatDate(slot.startTime)}</strong>
                                                        <span>
                                                            {formatTime(slot.startTime)} –{" "}
                                                            {formatTime(slot.endTime)}
                                                        </span>
                                                        <small>
                                                            {slot.availableSeats} of {slot.capacity} seats
                                                            available
                                                        </small>
                                                    </div>

                                                    <button
                                                        onClick={() => requestBooking(slot._id)}
                                                        disabled={
                                                            isFull ||
                                                            hasActiveBooking ||
                                                            Boolean(bookingSlot)
                                                        }
                                                        className="student-exam-book-button"
                                                    >
                                                        {isBusy
                                                            ? "Booking..."
                                                            : hasActiveBooking
                                                                ? "Already booked"
                                                                : isFull
                                                                    ? "Full"
                                                                    : "Book slot"}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                <div className="student-exam-card-footer">
                                    <MapPin size={15} />
                                    <span>
                                        Booking period: {formatDate(exam.bookingStart)} –{" "}
                                        {formatDate(exam.bookingEnd)}
                                    </span>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
            <ConfirmDialog
                open={confirmationOpen}
                title="Confirm examination booking"
                message="Are you sure you want to book this examination slot? Once confirmed, your seat will be reserved."
                confirmText="Confirm Booking"
                cancelText="Go Back"
                loading={Boolean(bookingSlot)}
                onConfirm={handleBooking}
                onCancel={() => {
                    if (bookingSlot) return;

                    setConfirmationOpen(false);
                    setSelectedSlot("");
                }}
            />
        </div>
    );
}
