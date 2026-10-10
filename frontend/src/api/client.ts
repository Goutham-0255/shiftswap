import type {
  HistoryEntry,
  Listing,
  ListingAction,
  MyShift,
  OpenListing,
  Staff,
} from './types'

// The only place that talks to the backend. Every request gets the
// "acting as" header, and every error becomes an ApiError with a readable
// message plus the rule violations (if any) the server sent back.

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'
const ACTOR_KEY = 'shiftswap.actorId'

export class ApiError extends Error {
  status: number
  details: unknown

  constructor(status: number, message: string, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

// The chosen identity lives in localStorage so it survives a page refresh.
// Wrapped in try/catch because storage can be blocked (private mode).
export function getActorId(): string | null {
  try {
    return localStorage.getItem(ACTOR_KEY)
  } catch {
    return null
  }
}

export function saveActorId(id: string | null) {
  try {
    if (id) localStorage.setItem(ACTOR_KEY, id)
    else localStorage.removeItem(ACTOR_KEY)
  } catch {
    // Not fatal: the choice just won't survive a refresh.
  }
}

async function request<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const headers: Record<string, string> = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const actorId = getActorId()
  if (actorId) headers['X-Actor-Id'] = actorId

  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Is the backend running?')
  }

  const json = await response.json().catch(() => null)
  if (!response.ok) {
    const message = json?.error?.message ?? `Request failed (${response.status})`
    throw new ApiError(response.status, message, json?.error?.details)
  }
  return json.data as T
}

export const api = {
  staff: () => request<Staff[]>('/api/staff'),
  addStaff: (name: string, certifications: string[]) =>
    request<Staff>('/api/staff', 'POST', { name, certifications }),
  myShifts: () => request<MyShift[]>('/api/shifts/mine'),
  openListings: () => request<OpenListing[]>('/api/listings?status=OPEN'),
  claimedListings: () => request<Listing[]>('/api/listings?status=CLAIMED'),
  history: () => request<HistoryEntry[]>('/api/history'),
  postShift: (shiftId: string) => request<Listing>('/api/listings', 'POST', { shiftId }),
  listingAction: (id: number, action: ListingAction) =>
    request<Listing>(`/api/listings/${id}/${action}`, 'POST'),
}
