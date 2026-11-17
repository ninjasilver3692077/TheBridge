import { Link } from "react-router-dom";
import { buttonGhost, eyebrow, pageLead, pageTitle } from "../../styles/ui.js";

function CreateListingHeader() {
  return (
    <>
      <Link to="/my-books" className={`-ml-3 mb-6 ${buttonGhost}`}>
        ← My Books
      </Link>

      <header className="max-w-2xl">
        <p className={eyebrow}>Share a book</p>
        <h1 className={`mt-3 ${pageTitle}`}>Create Listing</h1>
        <p className={`mt-2 ${pageLead}`}>
          Choose how you want to share this book with your community.
        </p>
      </header>
    </>
  );
}

export default CreateListingHeader;
