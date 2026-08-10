export default function SignalStrip({ items }) {
  return (
    <div className="signal-strip">
      {items.map((item) => (
        <div className="signal" key={item.label}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  );
}
