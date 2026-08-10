export default function SpotlightList({ items }) {
  return (
    <div className="spotlight-list">
      {items.map((item) => (
        <article className="spotlight-card" key={item.name}>
          <p className="spotlight-country">{item.country}</p>
          <h3>{item.name}</h3>
          <p>{item.summary}</p>
        </article>
      ))}
    </div>
  );
}
