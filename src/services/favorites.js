import { apiRequest } from "./apiClient.js";
import { toBookMetadata } from "./bookMetadata.js";

const PAGE_LIMIT = 100;

function toClientFavorite(favorite) {
  return {
    ...favorite.book,
    id: favorite.book.catalogId,
    favoriteId: favorite.id,
  };
}

export async function fetchFavorites({ signal } = {}) {
  const favorites = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const { data, meta } = await apiRequest(
      `/favorites?page=${page}&limit=${PAGE_LIMIT}`,
      { authenticated: true, signal },
    );
    favorites.push(...data.map(toClientFavorite));
    totalPages = meta.totalPages;
    page += 1;
  }

  return favorites;
}

export async function addFavorite(catalogBook) {
  const { data } = await apiRequest("/favorites", {
    method: "POST",
    authenticated: true,
    body: { book: toBookMetadata(catalogBook) },
  });

  return toClientFavorite(data);
}

export async function removeFavorite(favoriteId) {
  await apiRequest(`/favorites/${favoriteId}`, {
    method: "DELETE",
    authenticated: true,
  });
}
