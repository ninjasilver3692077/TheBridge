export type Role = "Member" | "Admin";
export type Condition = "Like new" | "Good condition" | "Used copy";
export type Modality = "Exchange" | "Loan" | "Rental" | "Sale";
export type DurationDays = 7 | 10 | 14 | 21;
export type LibraryBookStatus = "Available" | "Published" | "Reserved" | "Lent" | "Transferred";
export type ListingStatus = "Available" | "Reserved" | "Closed" | "Removed";
export type ListingClosureReason = "Withdrawn" | "Completed";
export type RequestStatus = "Pending" | "Accepted" | "Rejected" | "Cancelled" | "Completed";
export type RejectionReason =
  | "OwnerRejected"
  | "CompetingRequestAccepted"
  | "ListingWithdrawn"
  | "ListingRemoved";
export type RequestDirection = "received" | "sent";

export interface Timestamps {
  createdAt: string;
  updatedAt: string;
}

export interface Account extends Timestamps {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface PublicMember {
  id: string;
  name: string;
}

export interface BookMetadata {
  catalogId: string;
  title: string;
  author: string;
  genre: string;
  coverUrl: string | null;
  year: number | null;
  publisher: string | null;
  isbn: string | null;
  language: string | null;
}

export interface ListingTerms {
  desiredBook: BookMetadata | null;
  priceCop: number | null;
  durationDays: DurationDays | null;
}

export interface CurrentListingSummary {
  id: string;
  modality: Modality;
  status: ListingStatus;
}

export interface LibraryBookActivity {
  requestId: string;
  status: "Pending" | "Accepted";
  kind: "ReceivedRequest" | "OfferedExchange";
  counterpart: PublicMember;
}

export interface ModerationNote {
  listingId: string;
  reason: string;
  removedAt: string;
}

export interface LibraryBook extends Timestamps {
  id: string;
  book: BookMetadata;
  condition: Condition;
  notes: string;
  status: LibraryBookStatus;
  currentListing: CurrentListingSummary | null;
  activity: LibraryBookActivity | null;
  lastModeration: ModerationNote | null;
}

export interface Listing extends Timestamps {
  id: string;
  libraryBookId: string;
  owner: PublicMember;
  book: BookMetadata;
  condition: Condition;
  description: string;
  modality: Modality;
  terms: ListingTerms;
  status: ListingStatus;
  closureReason: ListingClosureReason | null;
}

export interface OwnListing extends Listing {
  moderation: { reason: string; removedAt: string } | null;
}

export interface ListingStats {
  total: number;
  byModality: Record<Modality, number>;
  averageSalePriceCop: number | null;
  averageRentalPriceCop: number | null;
  facets: { genres: string[]; conditions: Condition[] };
}

export interface RequestListingSummary {
  id: string;
  title: string;
  author: string;
  coverUrl: string | null;
  modality: Modality;
  status: ListingStatus;
}

export interface OfferedBookSnapshot {
  id: string;
  book: BookMetadata;
  condition: Condition;
}

export interface BookRequest extends Timestamps {
  id: string;
  listingId: string;
  owner: PublicMember;
  requester: PublicMember;
  listing: RequestListingSummary;
  offeredBookId: string | null;
  offeredBook: OfferedBookSnapshot | null;
  status: RequestStatus;
  rejectionReason: RejectionReason | null;
  quotedModality: Modality;
  quotedTerms: ListingTerms;
}

export interface Favorite {
  id: string;
  book: BookMetadata;
  createdAt: string;
}

export interface AuthSession {
  token: string;
  expiresAt: string;
  account: Account;
}

export interface AdminOverview {
  memberCount: number;
  listingsByStatus: Record<ListingStatus, number>;
  requestsByStatus: Record<RequestStatus, number>;
}

export interface MemberSummary {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface AdminListing extends Listing {
  ownerEmail: string;
  moderation: { reason: string; removedAt: string; removedBy: PublicMember } | null;
}

export interface AdminRequest extends BookRequest {
  ownerEmail: string;
  requesterEmail: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
}

export interface PasswordResetResult {
  message: string;
}

export interface AddBookInput {
  book: BookMetadata;
  condition: Condition;
  notes?: string;
}

export interface EditBookInput {
  condition?: Condition;
  notes?: string;
}

export interface CreateListingInput {
  libraryBookId: string;
  modality: Modality;
  terms: ListingTerms;
}

export interface EditListingInput {
  modality: Modality;
  terms: ListingTerms;
}

export interface SendRequestInput {
  offeredBookId?: string;
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface DataResponse<T> {
  data: T;
}

export interface PageResponse<T> {
  data: T[];
  meta: PageMeta;
}

export interface ErrorResponse {
  error: string;
  code: number;
}
