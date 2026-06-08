import type { CSSProperties } from "react";

type ChartDatum = {
  label: string;
  value: number;
  tone?: "green" | "amber" | "red" | "blue" | "neutral";
  href?: string;
};

const toneColors: Record<NonNullable<ChartDatum["tone"]>, string> = {
  green: "var(--brand)",
  amber: "var(--accent)",
  red: "var(--danger)",
  blue: "#39739d",
  neutral: "var(--muted)"
};

const defaultTones: NonNullable<ChartDatum["tone"]>[] = ["green", "blue", "amber", "red", "neutral"];

function sum(items: ChartDatum[]) {
  return items.reduce((total, item) => total + Math.max(0, item.value), 0);
}

function colorFor(item: ChartDatum, index: number) {
  return toneColors[item.tone ?? defaultTones[index % defaultTones.length]];
}

export function DonutChart({
  title,
  center,
  caption,
  data
}: {
  title: string;
  center: string | number;
  caption?: string;
  data: ChartDatum[];
}) {
  const total = sum(data);
  let cursor = 0;
  const gradient =
    total > 0
      ? data
          .map((item, index) => {
            const start = cursor;
            cursor += (Math.max(0, item.value) / total) * 360;
            return `${colorFor(item, index)} ${start}deg ${cursor}deg`;
          })
          .join(", ")
      : "var(--line) 0deg 360deg";

  return (
    <section className="chart-panel">
      <div>
        <h2 className="asset-title">{title}</h2>
        {caption ? <p className="subtle">{caption}</p> : null}
      </div>
      <div className="donut-layout">
        <div className="donut" style={{ "--donut": `conic-gradient(${gradient})` } as CSSProperties}>
          <div className="donut-center">
            <strong>{center}</strong>
            <span>Total</span>
          </div>
        </div>
        <div className="legend-list">
          {data.map((item, index) => (
            <div className="legend-item" key={item.label}>
              <span className="legend-dot" style={{ "--dot": colorFor(item, index) } as CSSProperties} />
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function BarList({
  title,
  caption,
  data,
  max
}: {
  title: string;
  caption?: string;
  data: ChartDatum[];
  max?: number;
}) {
  const largest = Math.max(max ?? 0, ...data.map((item) => item.value), 1);
  return (
    <section className="chart-panel">
      <div>
        <h2 className="asset-title">{title}</h2>
        {caption ? <p className="subtle">{caption}</p> : null}
      </div>
      <div className="bar-list">
        {data.map((item, index) => {
          const width = Math.max(3, Math.round((item.value / largest) * 100));
          const content = (
            <>
              <div className="bar-meta">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
              <div className="bar-track">
                <span
                  className="bar-fill"
                  style={{ "--bar": colorFor(item, index), width: `${width}%` } as CSSProperties}
                />
              </div>
            </>
          );
          return item.href ? (
            <a className="bar-row" href={item.href} key={item.label}>
              {content}
            </a>
          ) : (
            <div className="bar-row" key={item.label}>
              {content}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function StackedBar({
  title,
  caption,
  data
}: {
  title: string;
  caption?: string;
  data: ChartDatum[];
}) {
  const total = sum(data);
  return (
    <section className="chart-panel">
      <div>
        <h2 className="asset-title">{title}</h2>
        {caption ? <p className="subtle">{caption}</p> : null}
      </div>
      <div className="stacked-bar" aria-label={title}>
        {data.map((item, index) => (
          <span
            className="stacked-segment"
            key={item.label}
            title={`${item.label}: ${item.value}`}
            style={
              {
                "--segment": colorFor(item, index),
                width: total ? `${(Math.max(0, item.value) / total) * 100}%` : "0%"
              } as CSSProperties
            }
          />
        ))}
      </div>
      <div className="legend-list compact">
        {data.map((item, index) => (
          <div className="legend-item" key={item.label}>
            <span className="legend-dot" style={{ "--dot": colorFor(item, index) } as CSSProperties} />
            <span>{item.label}</span>
            <strong>{total ? `${Math.round((item.value / total) * 100)}%` : "0%"}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

export function TrendBars({
  title,
  caption,
  data
}: {
  title: string;
  caption?: string;
  data: { label: string; value: number; tone?: ChartDatum["tone"] }[];
}) {
  const largest = Math.max(...data.map((item) => item.value), 1);
  return (
    <section className="chart-panel">
      <div>
        <h2 className="asset-title">{title}</h2>
        {caption ? <p className="subtle">{caption}</p> : null}
      </div>
      <div className="trend-bars">
        {data.map((item, index) => (
          <div className="trend-item" key={item.label}>
            <span
              className="trend-bar"
              title={`${item.label}: ${item.value}`}
              style={
                {
                  "--bar": colorFor(item, index),
                  height: `${Math.max(8, (item.value / largest) * 100)}%`
                } as CSSProperties
              }
            />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
