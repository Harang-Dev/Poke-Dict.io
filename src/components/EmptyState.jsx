export default function EmptyState({ title, description, children }) {
  return (
    <section className="empty-state">
      <div className="empty-state__content">
        <p role="status">{title}</p>
        <p>{description}</p>
        {children}
      </div>
    </section>
  );
}
