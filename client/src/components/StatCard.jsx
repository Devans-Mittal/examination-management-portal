export default function StatCard({
    title,
    value,
    description,
    icon: Icon,
    loading = false
}) {
    return (
        <article className="stat-card">
            <div className="stat-card-top">
                <span>{title}</span>

                <div className="stat-card-icon">
                    {Icon && <Icon size={21} />}
                </div>
            </div>

            <div className="stat-card-value">
                {loading ? "..." : value}
            </div>

            <p>{description}</p>
        </article>
    );
}