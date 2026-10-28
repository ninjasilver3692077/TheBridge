import { useState } from "react";
import AppShell from "../components/AppShell.jsx";
import AddBookConfirm from "../components/add-book/AddBookConfirm.jsx";
import AddBookSearch from "../components/add-book/AddBookSearch.jsx";
import AddBookSuccess from "../components/add-book/AddBookSuccess.jsx";
import { eyebrow, pageLead, pageTitle } from "../styles/ui.js";

function AddBookPage() {
  const [phase, setPhase] = useState("search");
  const [selectedBook, setSelectedBook] = useState(null);
  const [savedBook, setSavedBook] = useState(null);
  const [searchSession, setSearchSession] = useState(0);

  const handleSelect = (book) => {
    setSelectedBook(book);
    setPhase("confirm");
  };

  const handleSaved = (book) => {
    setSavedBook(book);
    setPhase("success");
  };

  const handleAddAnother = () => {
    setSelectedBook(null);
    setSavedBook(null);
    setSearchSession((current) => current + 1);
    setPhase("search");
  };

  return (
    <AppShell
      title="Add a Book"
      subtitle="Add a physical book to your personal library"
    >
      {phase !== "success" && (
        <header className="mb-10 max-w-2xl">
          <p className={eyebrow}>Personal library</p>
          <h1 className={`mt-3 ${pageTitle}`}>Add a book</h1>
          <p className={`mt-2 ${pageLead}`}>
            Find your physical copy in the catalog, describe its condition,
            and add it to your library.
          </p>
        </header>
      )}

      <div className={phase === "search" ? "block" : "hidden"}>
        <AddBookSearch
          key={searchSession}
          onSelect={handleSelect}
        />
      </div>

      {phase === "confirm" && selectedBook && (
        <AddBookConfirm
          book={selectedBook}
          onBack={() => setPhase("search")}
          onSaved={handleSaved}
        />
      )}

      {phase === "success" && savedBook && (
        <AddBookSuccess
          book={savedBook}
          onAddAnother={handleAddAnother}
        />
      )}
    </AppShell>
  );
}

export default AddBookPage;
