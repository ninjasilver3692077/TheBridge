import { Router } from "express";
import type { Request, Response } from "express";
import mongoose from "mongoose";
import type { ClientSession, HydratedDocument } from "mongoose";
import type {
  BookRequest,
  DataResponse,
  ListingStatus,
  PageResponse,
  RequestDirection,
  RequestStatus,
} from "@/types";
import { AccountModel } from "../models/Account.js";
import { isPlainObject } from "../models/Favorite.js";
import { LibraryBookModel } from "../models/LibraryBook.js";
import type { LibraryBookDocument } from "../models/LibraryBook.js";
import { ListingModel } from "../models/Listing.js";
import {
  extractId,
  REQUEST_STATUSES,
  RequestModel,
  toBookRequestDto,
} from "../models/Request.js";
import type { RequestDocument } from "../models/Request.js";
import { currentAccount, requireAuth, requireRole } from "../server/auth.js";
import { requireDatabase } from "../server/db.js";
import { HttpError, methodNotAllowed } from "../server/errors.js";
import { readPagination, toPage } from "../server/pagination.js";
import {
  assertAllowedQueryKeys,
  readObjectId,
  readSearchQuery,
} from "./favorites.js";

const allowedListQueryKeys = new Set(["direction", "page", "limit", "status", "q"]);

function readDirection(value: unknown): RequestDirection {
  if (value === undefined) return "received";
  if (value === "received" || value === "sent") return value;
  throw new HttpError(400, "direction: must be received or sent.");
}

function readOptionalStatus(value: unknown): RequestStatus | undefined {
  if (value === undefined) return undefined;
  if (typeof value === "string" && REQUEST_STATUSES.includes(value as RequestStatus)) {
    return value as RequestStatus;
  }
  throw new HttpError(400, "status: invalid request status.");
}

function assertEmptyObjectBody(body: unknown): void {
  if (body === undefined) return;
  if (!isPlainObject(body)) {
    throw new HttpError(400, "body: must be an empty JSON object.");
  }
  const [firstKey] = Object.keys(body);
  if (firstKey !== undefined) {
    throw new HttpError(400, `${firstKey}: unknown field.`);
  }
}

function assertParticipant(
  doc: HydratedDocument<RequestDocument> | null,
  accountId: string,
): HydratedDocument<RequestDocument> {
  if (!doc) {
    throw new HttpError(404, "Request not found.");
  }
  const ownerId = extractId(doc.owner);
  const requesterId = extractId(doc.requester);
  if (ownerId !== accountId && requesterId !== accountId) {
    throw new HttpError(404, "Request not found.");
  }
  return doc;
}

async function hydrateRequestDto(
  doc: HydratedDocument<RequestDocument>,
  session: ClientSession,
  listingStatus?: ListingStatus,
): Promise<BookRequest> {
  const ownerId = extractId(doc.owner);
  const requesterId = extractId(doc.requester);
  const listingId = extractId(doc.listing);

  const ownerDoc = await AccountModel.findById(ownerId).select("name").session(session).exec();
  const requesterDoc = await AccountModel.findById(requesterId)
    .select("name")
    .session(session)
    .exec();
  const listingDoc = listingStatus
    ? null
    : await ListingModel.findById(listingId).select("status").session(session).exec();

  return toBookRequestDto(doc, {
    owner: { id: ownerId, name: ownerDoc?.name ?? "Member" },
    requester: { id: requesterId, name: requesterDoc?.name ?? "Member" },
    listingStatus: listingStatus ?? listingDoc?.status ?? doc.listingSummary.status,
  });
}

export const requestsRouter = Router();

requestsRouter.use(["/listings/:id/requests", "/requests"], (_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

requestsRouter
  .route("/listings/:id/requests")
  .post(
    requireDatabase,
    requireAuth,
    requireRole("Member"),
    async (
      req: Request<{ id: string }>,
      res: Response<DataResponse<BookRequest>>,
    ) => {
      const listingId = readObjectId(req.params.id, "id");
      const body = req.body === undefined ? {} : req.body;
      if (!isPlainObject(body)) {
        throw new HttpError(400, "body: must be a JSON object.");
      }
      for (const key of Object.keys(body)) {
        if (key !== "offeredBookId") {
          throw new HttpError(400, `${key}: unknown field.`);
        }
      }

      const account = currentAccount(res);

      const createdRequest = await mongoose.connection.transaction(async (session) => {
        const listing = await ListingModel.findById(listingId).session(session).exec();
        if (!listing || listing.status === "Removed") {
          throw new HttpError(404, "Listing not found.");
        }
        if (extractId(listing.owner) === account.id) {
          throw new HttpError(403, "You cannot request your own listing.");
        }

        let offeredBookId: string | null = null;
        if (listing.modality === "Exchange") {
          if (body.offeredBookId === undefined || body.offeredBookId === null) {
            throw new HttpError(400, "offeredBookId: required for Exchange requests.");
          }
          offeredBookId = readObjectId(body.offeredBookId, "offeredBookId");
        } else if (body.offeredBookId !== undefined && body.offeredBookId !== null) {
          throw new HttpError(400, "offeredBookId: only allowed for Exchange requests.");
        }

        if (listing.status !== "Available") {
          throw new HttpError(409, "Listing is not available.");
        }

        const existingRequest = await RequestModel.findOne({
          listing: listing._id,
          requester: account.id,
          status: { $in: ["Pending", "Accepted"] },
        })
          .session(session)
          .exec();
        if (existingRequest) {
          throw new HttpError(409, "You already have an active request for this listing.");
        }

        let offeredCopy: HydratedDocument<LibraryBookDocument> | null = null;
        if (offeredBookId !== null) {
          offeredCopy = await LibraryBookModel.findById(offeredBookId).session(session).exec();
          if (!offeredCopy || extractId(offeredCopy.owner) !== account.id) {
            throw new HttpError(404, "Offered book not found.");
          }
          if (offeredCopy.status !== "Available") {
            throw new HttpError(409, "Offered book is not available.");
          }

          const occupiedByRequest = await RequestModel.findOne({
            offeredBook: offeredCopy._id,
            status: { $in: ["Pending", "Accepted"] },
          })
            .session(session)
            .exec();
          if (occupiedByRequest) {
            throw new HttpError(409, "Offered book is already offered in an active request.");
          }

          const occupiedByListing = await ListingModel.findOne({
            libraryBook: offeredCopy._id,
            status: { $in: ["Available", "Reserved"] },
          })
            .session(session)
            .exec();
          if (occupiedByListing) {
            throw new HttpError(409, "Offered book is not available.");
          }
        }

        const listingGuard = await ListingModel.updateOne(
          { _id: listing._id, status: "Available" },
          { $inc: { revision: 1 } },
          { session },
        ).exec();
        if (listingGuard.matchedCount !== 1) {
          throw new HttpError(409, "Listing is not available.");
        }

        if (offeredCopy) {
          const copyGuard = await LibraryBookModel.updateOne(
            { _id: offeredCopy._id, owner: account.id, status: "Available", deletedAt: null },
            { $inc: { revision: 1 } },
            { session },
          ).exec();
          if (copyGuard.matchedCount !== 1) {
            throw new HttpError(409, "Offered book is not available.");
          }
        }

        const [created] = await RequestModel.create(
          [
            {
              listing: listing._id,
              owner: listing.owner,
              requester: account.id,
              offeredBook: offeredCopy ? offeredCopy._id : null,
              offeredBookSnapshot: offeredCopy
                ? {
                    id: String(offeredCopy._id),
                    book: offeredCopy.book,
                    condition: offeredCopy.condition,
                  }
                : null,
              listingSummary: {
                id: String(listing._id),
                title: listing.book.title,
                author: listing.book.author,
                coverUrl: listing.book.coverUrl ?? null,
                modality: listing.modality,
                status: listing.status,
              },
              status: "Pending",
              rejectionReason: null,
              quotedModality: listing.modality,
              quotedTerms: listing.terms,
            },
          ],
          { session },
        );

        if (!created) {
          throw new HttpError(500, "Unexpected server error.");
        }

        return hydrateRequestDto(created, session, listing.status);
      });

      res.status(201).json({ data: createdRequest });
    },
  )
  .all(methodNotAllowed(["POST"]));

requestsRouter
  .route("/requests")
  .get(
    requireDatabase,
    requireAuth,
    requireRole("Member"),
    async (req: Request, res: Response<PageResponse<BookRequest>>) => {
      const query = req.query as Record<string, unknown>;
      assertAllowedQueryKeys(query, allowedListQueryKeys);
      const direction = readDirection(query.direction);
      const status = readOptionalStatus(query.status);
      const pagination = readPagination(query);
      const searchRegex = readSearchQuery(query.q);
      const account = currentAccount(res);

      const filter: Record<string, unknown> =
        direction === "received" ? { owner: account.id } : { requester: account.id };
      if (status) {
        filter.status = status;
      }

      if (searchRegex) {
        const counterpartField = direction === "received" ? "requester" : "owner";
        const matchingAccounts = await AccountModel.find({ name: searchRegex })
          .select("_id")
          .exec();
        const counterpartIds = matchingAccounts.map((doc) => doc._id);
        filter.$or = [
          { "listingSummary.title": searchRegex },
          { "listingSummary.author": searchRegex },
          { [counterpartField]: { $in: counterpartIds } },
        ];
      }

      const [total, docs] = await Promise.all([
        RequestModel.countDocuments(filter).exec(),
        RequestModel.find(filter)
          .sort({ createdAt: -1, _id: -1 })
          .skip(pagination.skip)
          .limit(pagination.limit)
          .populate("owner", "name")
          .populate("requester", "name")
          .populate("listing", "status")
          .exec(),
      ]);

      res.json(toPage(docs.map((doc) => toBookRequestDto(doc)), total, pagination));
    },
  )
  .all(methodNotAllowed(["GET", "HEAD"]));

requestsRouter
  .route("/requests/:id")
  .get(
    requireDatabase,
    requireAuth,
    requireRole("Member"),
    async (
      req: Request<{ id: string }>,
      res: Response<DataResponse<BookRequest>>,
    ) => {
      const requestId = readObjectId(req.params.id, "id");
      const account = currentAccount(res);

      const doc = await RequestModel.findById(requestId)
        .populate("owner", "name")
        .populate("requester", "name")
        .populate("listing", "status")
        .exec();

      if (!doc) {
        throw new HttpError(404, "Request not found.");
      }

      const dto = toBookRequestDto(doc);
      if (dto.owner.id !== account.id && dto.requester.id !== account.id) {
        throw new HttpError(404, "Request not found.");
      }

      res.json({ data: dto });
    },
  )
  .all(methodNotAllowed(["GET", "HEAD"]));

requestsRouter
  .route("/requests/:id/accept")
  .patch(
    requireDatabase,
    requireAuth,
    requireRole("Member"),
    async (
      req: Request<{ id: string }>,
      res: Response<DataResponse<BookRequest>>,
    ) => {
      const requestId = readObjectId(req.params.id, "id");
      assertEmptyObjectBody(req.body);
      const account = currentAccount(res);

      const acceptedRequest = await mongoose.connection.transaction(async (session) => {
        const doc = assertParticipant(
          await RequestModel.findById(requestId).session(session).exec(),
          account.id,
        );
        if (extractId(doc.owner) !== account.id) {
          throw new HttpError(403, "Only the listing owner can accept this request.");
        }
        if (doc.status !== "Pending") {
          throw new HttpError(409, "Only Pending requests can be accepted.");
        }

        const listing = await ListingModel.findById(extractId(doc.listing))
          .session(session)
          .exec();
        if (!listing || listing.status !== "Available") {
          throw new HttpError(409, "Listing is no longer available.");
        }

        const libraryBook = await LibraryBookModel.findById(extractId(listing.libraryBook))
          .session(session)
          .exec();
        if (!libraryBook || libraryBook.status !== "Published") {
          throw new HttpError(409, "Listing copy is not available.");
        }

        if (doc.quotedModality === "Exchange") {
          if (!doc.offeredBook) {
            throw new HttpError(409, "Exchange request has no offered book.");
          }
          const offeredCopy = await LibraryBookModel.findById(extractId(doc.offeredBook))
            .session(session)
            .exec();
          if (!offeredCopy || offeredCopy.status !== "Available") {
            throw new HttpError(409, "Offered book is no longer available.");
          }
          offeredCopy.status = "Reserved";
          await offeredCopy.save({ session });
        }

        libraryBook.status =
          doc.quotedModality === "Loan" || doc.quotedModality === "Rental"
            ? "Lent"
            : "Reserved";
        await libraryBook.save({ session });

        listing.status = "Reserved";
        await listing.save({ session });

        doc.status = "Accepted";
        doc.rejectionReason = null;
        doc.listingSummary.status = "Reserved";
        await doc.save({ session });

        await RequestModel.updateMany(
          { listing: listing._id, _id: { $ne: doc._id }, status: "Pending" },
          {
            $set: {
              status: "Rejected",
              rejectionReason: "CompetingRequestAccepted",
              "listingSummary.status": "Reserved",
            },
          },
          { session },
        ).exec();

        return hydrateRequestDto(doc, session, "Reserved");
      });

      res.json({ data: acceptedRequest });
    },
  )
  .all(methodNotAllowed(["PATCH"]));

requestsRouter
  .route("/requests/:id/reject")
  .patch(
    requireDatabase,
    requireAuth,
    requireRole("Member"),
    async (
      req: Request<{ id: string }>,
      res: Response<DataResponse<BookRequest>>,
    ) => {
      const requestId = readObjectId(req.params.id, "id");
      assertEmptyObjectBody(req.body);
      const account = currentAccount(res);

      const rejectedRequest = await mongoose.connection.transaction(async (session) => {
        const doc = assertParticipant(
          await RequestModel.findById(requestId).session(session).exec(),
          account.id,
        );
        if (extractId(doc.owner) !== account.id) {
          throw new HttpError(403, "Only the listing owner can reject this request.");
        }
        if (doc.status !== "Pending") {
          throw new HttpError(409, "Only Pending requests can be rejected.");
        }

        doc.status = "Rejected";
        doc.rejectionReason = "OwnerRejected";
        await doc.save({ session });

        return hydrateRequestDto(doc, session);
      });

      res.json({ data: rejectedRequest });
    },
  )
  .all(methodNotAllowed(["PATCH"]));

requestsRouter
  .route("/requests/:id/cancel")
  .patch(
    requireDatabase,
    requireAuth,
    requireRole("Member"),
    async (
      req: Request<{ id: string }>,
      res: Response<DataResponse<BookRequest>>,
    ) => {
      const requestId = readObjectId(req.params.id, "id");
      assertEmptyObjectBody(req.body);
      const account = currentAccount(res);

      const cancelledRequest = await mongoose.connection.transaction(async (session) => {
        const doc = assertParticipant(
          await RequestModel.findById(requestId).session(session).exec(),
          account.id,
        );
        if (extractId(doc.requester) !== account.id) {
          throw new HttpError(403, "Only the requester can cancel this request.");
        }
        if (doc.status !== "Pending") {
          throw new HttpError(409, "Only Pending requests can be cancelled.");
        }

        doc.status = "Cancelled";
        doc.rejectionReason = null;
        await doc.save({ session });

        return hydrateRequestDto(doc, session);
      });

      res.json({ data: cancelledRequest });
    },
  )
  .all(methodNotAllowed(["PATCH"]));

requestsRouter
  .route("/requests/:id/complete")
  .patch(
    requireDatabase,
    requireAuth,
    requireRole("Member"),
    async (
      req: Request<{ id: string }>,
      res: Response<DataResponse<BookRequest>>,
    ) => {
      const requestId = readObjectId(req.params.id, "id");
      assertEmptyObjectBody(req.body);
      const account = currentAccount(res);

      const completedRequest = await mongoose.connection.transaction(async (session) => {
        const doc = assertParticipant(
          await RequestModel.findById(requestId).session(session).exec(),
          account.id,
        );
        if (extractId(doc.owner) !== account.id) {
          throw new HttpError(403, "Only the listing owner can complete this request.");
        }
        if (doc.status !== "Accepted") {
          throw new HttpError(409, "Only Accepted requests can be completed.");
        }

        const listing = await ListingModel.findById(extractId(doc.listing))
          .session(session)
          .exec();
        if (!listing) {
          throw new HttpError(409, "Listing cannot be completed.");
        }

        const isLoanOrRental =
          doc.quotedModality === "Loan" || doc.quotedModality === "Rental";

        if (isLoanOrRental) {
          if (listing.status !== "Reserved" && listing.status !== "Removed") {
            throw new HttpError(409, "Listing is not in a completable state.");
          }

          const libraryBook = await LibraryBookModel.findById(extractId(listing.libraryBook))
            .session(session)
            .exec();
          if (!libraryBook || libraryBook.status !== "Lent") {
            throw new HttpError(409, "Library book is not currently lent.");
          }

          libraryBook.status = "Available";
          await libraryBook.save({ session });

          if (listing.status === "Reserved") {
            listing.status = "Closed";
            listing.closureReason = "Completed";
            await listing.save({ session });
          }
        } else {
          if (listing.status !== "Reserved") {
            throw new HttpError(409, "Listing is not Reserved.");
          }

          const libraryBook = await LibraryBookModel.findById(extractId(listing.libraryBook))
            .session(session)
            .exec();
          if (!libraryBook || libraryBook.status !== "Reserved") {
            throw new HttpError(409, "Library book is not Reserved.");
          }

          if (doc.quotedModality === "Exchange") {
            if (!doc.offeredBook) {
              throw new HttpError(409, "Exchange request has no offered book.");
            }
            const offeredCopy = await LibraryBookModel.findById(extractId(doc.offeredBook))
              .session(session)
              .exec();
            if (!offeredCopy || offeredCopy.status !== "Reserved") {
              throw new HttpError(409, "Offered book is not Reserved.");
            }
            offeredCopy.status = "Transferred";
            await offeredCopy.save({ session });
          }

          libraryBook.status = "Transferred";
          await libraryBook.save({ session });

          listing.status = "Closed";
          listing.closureReason = "Completed";
          await listing.save({ session });
        }

        doc.status = "Completed";
        doc.rejectionReason = null;
        doc.listingSummary.status = listing.status;
        await doc.save({ session });

        return hydrateRequestDto(doc, session, listing.status);
      });

      res.json({ data: completedRequest });
    },
  )
  .all(methodNotAllowed(["PATCH"]));

