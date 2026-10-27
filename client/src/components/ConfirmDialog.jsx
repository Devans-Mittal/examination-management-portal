import { AlertTriangle, CheckCircle, X } from "lucide-react";
import "./ConfirmDialog.css";

export default function ConfirmDialog({
    open,
    title = "Are you sure?",
    message = "Please confirm that you want to continue.",
    confirmText = "Confirm",
    cancelText = "Go back",
    danger = false,
    loading = false,
    onConfirm,
    onCancel,
}) {
    if (!open) return null;

    return (
        <div
            className="confirm-dialog-overlay"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !loading) {
                    onCancel();
                }
            }}
        >
            <section
                className="confirm-dialog"
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="confirm-dialog-title"
                aria-describedby="confirm-dialog-message"
            >
                <button
                    type="button"
                    className="confirm-dialog-close"
                    onClick={onCancel}
                    disabled={loading}
                    aria-label="Close confirmation"
                >
                    <X size={19} />
                </button>

                <div
                    className={`confirm-dialog-icon ${danger
                            ? "confirm-dialog-icon-danger"
                            : "confirm-dialog-icon-primary"
                        }`}
                >
                    {danger ? (
                        <AlertTriangle size={25} />
                    ) : (
                        <CheckCircle size={25} />
                    )}
                </div>

                <h2 id="confirm-dialog-title">{title}</h2>

                <p id="confirm-dialog-message">{message}</p>

                <div className="confirm-dialog-actions">
                    <button
                        type="button"
                        className="confirm-dialog-button confirm-dialog-cancel"
                        onClick={onCancel}
                        disabled={loading}
                    >
                        {cancelText}
                    </button>

                    <button
                        type="button"
                        className={`confirm-dialog-button ${danger
                                ? "confirm-dialog-danger"
                                : "confirm-dialog-primary"
                            }`}
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? "Please wait..." : confirmText}
                    </button>
                </div>
            </section>
        </div>
    );
}