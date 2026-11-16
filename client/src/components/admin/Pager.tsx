const Pager = ({
  page,
  pages,
  onPage,
}: {
  page: number;
  pages: number;
  onPage: (n: number) => void;
}) => {
  if (pages <= 1) return null;
  return (
    <div className="mt-6 flex items-center justify-center gap-4 text-sm">
      <button
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
        className="rounded-md bg-lama text-white py-1 px-3 disabled:opacity-40"
      >
        Previous
      </button>
      <span className="text-gray-500">
        Page {page} of {pages}
      </span>
      <button
        disabled={page >= pages}
        onClick={() => onPage(page + 1)}
        className="rounded-md bg-lama text-white py-1 px-3 disabled:opacity-40"
      >
        Next
      </button>
    </div>
  );
};

export default Pager;