// Marketplace Utilities

export interface Listing {
  id: string;
  title: string;
  seller: string;
  price: number;
  description: string;
  category: string;
  rating: number;
  reviews: number;
  image: string;
}

export interface Transaction {
  id: string;
  buyerId: string;
  sellerId: string;
  listingId: string;
  amount: number;
  status: "pending" | "completed" | "cancelled";
  createdAt: Date;
  completedAt?: Date;
}

// Listing APIs
export async function createListing(
  sellerId: string,
  listing: Omit<Listing, "id" | "seller">
) {
  return fetch("/api/marketplace/listings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sellerId, ...listing }),
  }).then(r => r.json());
}

export async function getListings(category?: string) {
  const url = new URL("/api/marketplace/listings", location.origin);
  if (category) url.searchParams.set("category", category);
  return fetch(url).then(r => r.json());
}

export async function getListing(id: string) {
  return fetch(`/api/marketplace/listings/${id}`).then(r => r.json());
}

// Transaction APIs
export async function purchaseItem(
  buyerId: string,
  listingId: string,
  amount: number
) {
  return fetch("/api/marketplace/transactions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ buyerId, listingId, amount }),
  }).then(r => r.json());
}

export async function getUserTransactions(userId: string) {
  return fetch(`/api/marketplace/transactions?userId=${userId}`).then(r => r.json());
}

// Search & Filter
export function searchListings(listings: Listing[], query: string) {
  return listings.filter(item =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.description.toLowerCase().includes(query.toLowerCase())
  );
}

export function filterByCategory(listings: Listing[], category: string) {
  return listings.filter(item => item.category === category);
}

export function sortListings(listings: Listing[], sortBy: "price" | "rating" | "newest") {
  const copy = [...listings];
  switch (sortBy) {
    case "price":
      return copy.sort((a, b) => a.price - b.price);
    case "rating":
      return copy.sort((a, b) => b.rating - a.rating);
    case "newest":
      return copy.reverse();
    default:
      return copy;
  }
}
