function ListingCoverCard({ listing }) {
  return (
    <figure className="mx-auto w-full max-w-[20rem] lg:mx-0 lg:max-w-none">
      <div className="overflow-hidden rounded-2xl bg-surface-muted shadow-lift">
        {listing.cover ? (
          <img
            src={listing.cover}
            alt={`Cover of ${listing.title}`}
            className="aspect-[3/4] h-full w-full object-cover"
          />
        ) : (
          <div className="flex aspect-[3/4] items-center justify-center p-6 text-center text-base font-semibold text-ink-muted">
            {listing.title}
          </div>
        )}
      </div>
    </figure>
  );
}

export default ListingCoverCard;
