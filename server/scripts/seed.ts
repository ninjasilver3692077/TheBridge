import mongoose from "mongoose";
import { pathToFileURL } from "node:url";
import type { BookMetadata, Modality, ListingTerms } from "@/types";
import { AccountModel } from "../../models/Account.js";
import { LibraryBookModel } from "../../models/LibraryBook.js";
import { ListingModel } from "../../models/Listing.js";
import { hashPassword, validatePassword } from "../accounts.js";
import { connectDatabase } from "../db.js";
import { readEnv } from "../env.js";

const demoBooks = [
  { catalogId: "/works/OL893415W", title: "Don Quixote", author: "Miguel de Cervantes", genre: "Classic", modality: "Exchange" },
  { catalogId: "/works/OL45804W", title: "Dune", author: "Frank Herbert", genre: "Science Fiction", modality: "Sale" },
  { catalogId: "/works/OL1168083W", title: "1984", author: "George Orwell", genre: "Classic", modality: "Loan" },
  { catalogId: "/works/OL82563W", title: "The Lord of the Rings", author: "J. R. R. Tolkien", genre: "Fantasy", modality: "Rental" },
] as const;

function demoTerms(modality: Modality): ListingTerms {
  return {
    desiredBook: null,
    priceCop: modality === "Sale" ? 40000 : modality === "Rental" ? 10000 : null,
    durationDays: modality === "Loan" || modality === "Rental" ? 14 : null,
    paymentMethods: modality === "Sale" ? ["Cash", "Nequi"] : null,
  };
}

export async function seedDemo(password: string): Promise<{ members: number; listingsCreated: number }> {
  validatePassword(password);
  await AccountModel.init();
  await LibraryBookModel.init();
  await ListingModel.init();
  const passwordHash = await hashPassword(password);
  const owners: string[] = [];
  for (const [index, name] of ["Alex Demo", "Morgan Demo", "Sam Demo"].entries()) {
    const email = `demo${index + 1}@thebridge.example.invalid`;
    let account = await AccountModel.findOne({ email }).exec();
    if (account && (account.role !== "Member" || account.name !== name)) throw new Error("A demo email is already occupied by a different account.");
    account ??= await AccountModel.create({ name, email, passwordHash, role: "Member" });
    owners.push(String(account._id));
  }
  let listingsCreated = 0;
  for (const [index, input] of demoBooks.entries()) {
    const owner = owners[index % owners.length];
    if (!owner) throw new Error("Demo owner missing.");
    const exists = await LibraryBookModel.findOne({ owner, "book.catalogId": input.catalogId }).exec();
    if (exists) continue;
    const book: BookMetadata = { catalogId: input.catalogId, title: input.title, author: input.author, genre: input.genre, coverUrl: null, year: null, publisher: null, isbn: null, language: "eng" };
    await mongoose.connection.transaction(async (session) => {
      const [copy] = await LibraryBookModel.create([{ owner, book, condition: "Good condition", notes: "Demo copy for in-person handover.", status: "Published" }], { session });
      if (!copy) throw new Error("Demo copy missing.");
      await ListingModel.create([{ libraryBook: copy._id, owner, book, condition: copy.condition, description: copy.notes, modality: input.modality, terms: demoTerms(input.modality), status: "Available" }], { session });
    });
    listingsCreated++;
  }
  return { members: owners.length, listingsCreated };
}

async function run(): Promise<void> {
  const password = validatePassword(process.env.SEED_PASSWORD);
  await connectDatabase(readEnv().mongodbUri);
  const result = await seedDemo(password);
  console.log(`Demo seed ready: ${result.members} Members; ${result.listingsCreated} new listings. Existing accounts, passwords and books were not reset.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run().catch(() => { console.error("Demo seed failed. Check database configuration and SEED_PASSWORD; no credentials are logged."); process.exitCode = 1; }).finally(() => mongoose.disconnect());
}
