export function EmptyState({ title, copy }: { title: string; copy?: string }) {
  return (
    <div className="surface surface-pad">
      <strong>{title}</strong>
      {copy ? <p className="page-copy">{copy}</p> : null}
    </div>
  );
}
