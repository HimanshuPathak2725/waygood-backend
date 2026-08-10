export default function InfoCard({ title, body }) {
  return (
    <article className="info-card">
      <h3>{title}</h3>
      <p>{body}</p>
    </article>
  );
}
