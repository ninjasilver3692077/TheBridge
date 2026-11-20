function RequestTerms({ terms }) {
  if (terms.length === 0) return null;

  return (
    <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm leading-6 text-ink">
      {terms.map(({ label, value }) => (
        <div key={label} className="flex gap-1.5">
          <dt className="font-semibold">{label}:</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export default RequestTerms;
