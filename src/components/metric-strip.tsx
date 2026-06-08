export function MetricStrip({ items }: { items: { label: string; value: string | number }[] }) {
  return (
    <section className="metric-strip">
      {items.map((item) => (
        <div className="metric-cell" key={item.label}>
          <div className="metric-label">{item.label}</div>
          <div className="metric-value">{item.value}</div>
        </div>
      ))}
    </section>
  );
}
