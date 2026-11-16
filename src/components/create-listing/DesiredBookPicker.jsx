import { useRef } from "react";
import { useCatalogSearch } from "../../hooks/useCatalogSearch.js";
import DesiredBookSearch from "./DesiredBookSearch.jsx";
import SelectedDesiredBook from "./SelectedDesiredBook.jsx";

function toDesiredBookMeta(book) {
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    year: book.year,
    cover: book.cover || "",
    isbn: book.isbn || null,
    publisher: book.publisher || null,
  };
}

function DesiredBookPicker({ values, error, onChange }) {
  const search = useCatalogSearch();
  const inputRef = useRef(null);
  const changeButtonRef = useRef(null);
  const selected = values.desiredBookMeta;

  const handleQueryChange = (event) => {
    search.handleQueryChange(event);
    onChange("desiredBookQuery", event.target.value);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      search.submitSearch();
    }
  };

  const selectBook = (book) => {
    onChange("desiredBookMeta", toDesiredBookMeta(book));
    onChange("desiredBook", book.title);
    requestAnimationFrame(() => changeButtonRef.current?.focus());
  };

  const changeBook = () => {
    onChange("desiredBookMeta", null);
    onChange("desiredBook", "");
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const removeBook = () => {
    onChange("desiredBookMeta", null);
    onChange("desiredBook", "");
    onChange("desiredBookQuery", "");
    search.resetSearch();
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  if (selected) {
    return (
      <SelectedDesiredBook
        selected={selected}
        changeButtonRef={changeButtonRef}
        onChangeBook={changeBook}
        onRemove={removeBook}
      />
    );
  }

  return (
    <DesiredBookSearch
      search={search}
      inputRef={inputRef}
      error={error}
      onQueryChange={handleQueryChange}
      onKeyDown={handleKeyDown}
      onSelect={selectBook}
    />
  );
}

export default DesiredBookPicker;
