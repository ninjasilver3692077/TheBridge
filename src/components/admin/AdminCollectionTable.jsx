import { card } from "../../styles/ui.js";

function AdminCollectionTable({ label, columns, items, renderRow }) {
  return (
    <div className={`overflow-x-auto ${card}`}>
      <table className="w-full min-w-[40rem] text-left text-sm">
        <caption className="sr-only">{label}</caption>
        <thead className="border-b border-line text-xs uppercase tracking-wide text-ink-muted">
          <tr>
            {columns.map((column) => (
              <th key={column} scope="col" className="px-4 py-3 font-semibold">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">{items.map(renderRow)}</tbody>
      </table>
    </div>
  );
}

export default AdminCollectionTable;
