import { useCallback, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useApiResource } from "./useApiResource.js";
import { publishListing } from "../services/listings.js";
import { resolveListingBook } from "../services/myBooks.js";

export function useCreateListing() {
  const [searchParams] = useSearchParams();
  const [published, setPublished] = useState(null);
  const requestedId = searchParams.get("book");
  const load = useCallback(
    (signal) => resolveListingBook(requestedId, { signal }),
    [requestedId],
  );
  const { status, data: resolved, error, reload } = useApiResource(load);
  const book = published ? published.book : resolved?.book ?? null;
  const notice = published ? null : resolved?.notice ?? null;

  const handlePublish = async ({ modality, values }) => {
    const listing = await publishListing(book.id, modality, values);
    setPublished({ listing, book });
  };

  return { status, error, reload, book, notice, published, handlePublish };
}
