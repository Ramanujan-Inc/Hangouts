# Hangouts App - Development Tasks

## 📊 Task Tracker

| Task | Description | Status |
| :--- | :--- | :---: |
| **Task 1** | Backend API: Hangouts CRUD & Participants | ✅ DONE |
| **Task 2** | Backend API: Spatial Map Query & Memories Endpoint | ⚠️ PARTIAL |
| **Task 3** | Backend API: Gallery & Photo Management | ❌ TODO |
| **Task 4** | Backend API: Storage Quota & BYOS Link Integration | ❌ TODO |
| **Task 5** | Backend API: Hangout Notes | ❌ TODO |
| **Task 6** | Backend API: Expenses & Equal Split Settlement | ❌ TODO |
| **Task 7** | Frontend Foundation: API Client & Auth Context | ✅ DONE |
| **Task 8** | Frontend Views: Dedicated Notes Page & Groups UI | ❌ TODO |
| **Task 9** | Frontend Integration: Profile Page & BYOS Modal | ⚠️ PARTIAL |
| **Task 10** | Frontend Integration: Timeline Feed & Memories Card | ❌ TODO |
| **Task 11** | Frontend Integration: Create Hangout Form | ❌ TODO |
| **Task 12** | Frontend Integration: Interactive Map Provider | ✅ DONE |
| **Task 13** | Frontend Integration: Hangout Detail Page Tabs | ❌ TODO |

---

## 🛠️ Tasks

## Task 1 [DONE - ✅]
### Backend API: Hangouts CRUD & Participants
**Prerequisites**: None

#### 🎯 Target Files
- `[NEW]` [server/app/schemas/hangout.py](file:///home/snraw/Programming/Hangouts/server/app/schemas/hangout.py)
- `[NEW]` [server/app/services/hangouts.py](file:///home/snraw/Programming/Hangouts/server/app/services/hangouts.py)
- `[NEW]` [server/app/api/v1/hangouts.py](file:///home/snraw/Programming/Hangouts/server/app/api/v1/hangouts.py)
- `[MODIFY]` [server/app/api/v1/router.py](file:///home/snraw/Programming/Hangouts/server/app/api/v1/router.py)
- `[NEW]` [server/tests/api/test_hangouts.py](file:///home/snraw/Programming/Hangouts/server/tests/api/test_hangouts.py)

#### 📌 Requirements & Endpoints
Implement lifecycle CRUD management for `hangouts` and `hangout_participants` tables in [server/schema.sql](file:///home/snraw/Programming/Hangouts/server/schema.sql#L38-L61).

- `POST /api/v1/hangouts`: Create hangout (title, description, hangout_date, hangout_time, location_name, latitude, longitude, cover_photo_url, optional group_id).
- `GET /api/v1/hangouts`: Search & filter hangouts using URL query parameters:
  - `q` (optional): `ILIKE` search matching against both `title` and `location_name`.
  - `date` (optional): Filter by exact date (`YYYY-MM-DD`).
  - `group_id` (optional): Filter by group UUID.
- `GET /api/v1/hangouts/{id}`: Detailed hangout view with creator profile and participant list.
- `PATCH /api/v1/hangouts/{id}`: Update hangout details (creator only).
- `DELETE /api/v1/hangouts/{id}`: Delete hangout (creator only).
- `POST /api/v1/hangouts/{id}/participants`: Add participant to hangout (allowed by any active participant).
- `DELETE /api/v1/hangouts/{id}/participants/{user_id}`: Remove participant (creator can kick; participants can leave/remove self).

#### ✅ Acceptance Criteria
- `q` parameter performs ILIKE matching on `title` and `location_name`.
- Any existing participant can invite new members to the hangout.
- Pytest coverage in `test_hangouts.py` validating authorization and filters.

---

## Task 2 [PARTIAL - ⚠️]
### Backend API: Spatial Map Query & Memories Endpoint
**Prerequisites**: Task 1 (Backend API: Hangouts CRUD & Participants)

#### 🎯 Target Files
- `[MODIFY]` [server/app/api/v1/hangouts.py](file:///home/snraw/Programming/Hangouts/server/app/api/v1/hangouts.py)
- `[NEW]` [server/app/api/v1/memories.py](file:///home/snraw/Programming/Hangouts/server/app/api/v1/memories.py)
- `[MODIFY]` [server/app/api/v1/router.py](file:///home/snraw/Programming/Hangouts/server/app/api/v1/router.py)
- `[NEW]` [server/tests/api/test_memories.py](file:///home/snraw/Programming/Hangouts/server/tests/api/test_memories.py)

#### 📌 Requirements & Endpoints
- **Spatial Map Query** ✅: Add `GET /api/v1/hangouts/map` returning hangouts with non-null coordinates (`latitude`, `longitude`) matching an optional bounding box (`min_lat`, `max_lat`, `min_lng`, `max_lng`).
- **Memories Endpoint** ❌: Create `GET /api/v1/memories/on-this-day` returning hangouts occurring on today's month & day in past years (`EXTRACT(MONTH FROM hangout_date)` and `EXTRACT(DAY FROM hangout_date)`).

#### ✅ Acceptance Criteria
- Map endpoint returns JSON array with coordinates and location names.
- Memories endpoint accurately filters past historical hangouts for the current date.
- Pytest coverage in `test_memories.py` validating spatial map bounding box queries and date filters.

---

## Task 3 [TODO - ❌]
### Backend API: Gallery & Photo Management
**Prerequisites**: None

#### 🎯 Target Files
- `[NEW]` [server/app/schemas/photo.py](file:///home/snraw/Programming/Hangouts/server/app/schemas/photo.py)
- `[NEW]` [server/app/services/photos.py](file:///home/snraw/Programming/Hangouts/server/app/services/photos.py)
- `[NEW]` [server/app/api/v1/photos.py](file:///home/snraw/Programming/Hangouts/server/app/api/v1/photos.py)
- `[MODIFY]` [server/app/api/v1/router.py](file:///home/snraw/Programming/Hangouts/server/app/api/v1/router.py)
- `[NEW]` [server/tests/api/test_photos.py](file:///home/snraw/Programming/Hangouts/server/tests/api/test_photos.py)

#### 📌 Requirements & Endpoints
Implement endpoints for `photos` table in [server/schema.sql](file:///home/snraw/Programming/Hangouts/server/schema.sql#L64-L73).

- `POST /api/v1/hangouts/{id}/photos`: Upload photo file to Supabase Storage bucket, generate thumbnail, insert DB record with `caption` and `is_shared` flag.
- `GET /api/v1/hangouts/{id}/photos`: Retrieve photos for a hangout. Filter `is_shared = false` items so they are only visible to the user who uploaded them.
- `DELETE /api/v1/photos/{photo_id}`: Remove photo record and storage object (uploader only).

#### ✅ Acceptance Criteria
- File uploads are validated for image MIME types.
- Private photos (`is_shared = false`) are hidden from non-owner participants.
- Pytest coverage in `test_photos.py` validating file upload controls, MIME validation, and private photo privacy.

---

## Task 4 [TODO - ❌]
### Backend API: Storage Quota & BYOS Link Integration
**Prerequisites**: Task 3 (Backend API: Gallery & Photo Management)

#### 🎯 Target Files
- `[MODIFY]` [server/schema.sql](file:///home/snraw/Programming/Hangouts/server/schema.sql)
- `[NEW]` [server/app/services/storage.py](file:///home/snraw/Programming/Hangouts/server/app/services/storage.py)
- `[NEW]` [server/app/api/v1/storage.py](file:///home/snraw/Programming/Hangouts/server/app/api/v1/storage.py)
- `[MODIFY]` [server/app/api/v1/router.py](file:///home/snraw/Programming/Hangouts/server/app/api/v1/router.py)
- `[NEW]` [server/tests/api/test_storage.py](file:///home/snraw/Programming/Hangouts/server/tests/api/test_storage.py)

#### 📌 Requirements & Endpoints
- Update [server/schema.sql](file:///home/snraw/Programming/Hangouts/server/schema.sql) to add `user_storage_providers` table (user_id, provider_name, provider_url).
- `GET /api/v1/storage/usage`: Calculate total byte usage uploaded by the user vs max quota (e.g. 500 MB limit).
- `POST /api/v1/storage/byos/link`: Link external media from cloud providers (Google Drive, Dropbox, OneDrive) without consuming native storage quota.

#### ✅ Acceptance Criteria
- Upload quota calculation blocks direct image uploads when limit is reached.
- BYOS links display inline alongside uploaded images.
- Pytest coverage in `test_storage.py` validating storage byte calculations and BYOS link generation.

---

## Task 5 [TODO - ❌]
### Backend API: Hangout Notes
**Prerequisites**: None

#### 🎯 Target Files
- `[NEW]` [server/app/schemas/note.py](file:///home/snraw/Programming/Hangouts/server/app/schemas/note.py)
- `[NEW]` [server/app/services/notes.py](file:///home/snraw/Programming/Hangouts/server/app/services/notes.py)
- `[NEW]` [server/app/api/v1/notes.py](file:///home/snraw/Programming/Hangouts/server/app/api/v1/notes.py)
- `[MODIFY]` [server/app/api/v1/router.py](file:///home/snraw/Programming/Hangouts/server/app/api/v1/router.py)
- `[NEW]` [server/tests/api/test_notes.py](file:///home/snraw/Programming/Hangouts/server/tests/api/test_notes.py)

#### 📌 Requirements & Endpoints
Implement notes management endpoints using `notes` table in [server/schema.sql](file:///home/snraw/Programming/Hangouts/server/schema.sql#L75-L84).

- `POST /api/v1/hangouts/{id}/notes`: Create a note (content, `is_shared` toggle).
- `GET /api/v1/hangouts/{id}/notes`: Get notes for a specific hangout (shared notes visible to all participants; private notes visible only to author).
- `GET /api/v1/notes/my-notes`: Get all notes created by current user across all hangouts.
- `PATCH /api/v1/notes/{note_id}` & `DELETE /api/v1/notes/{note_id}`: Edit or delete note (author only).

#### ✅ Acceptance Criteria
- Private notes enforce author-only access.
- `my-notes` returns all authored notes ordered by `created_at DESC`.
- Pytest coverage in `test_notes.py` validating note CRUD, private note isolation, and my-notes retrieval.

---

## Task 6 [TODO - ❌]
### Backend API: Expenses & Equal Split Settlement
**Prerequisites**: None

#### 🎯 Target Files
- `[NEW]` [server/app/schemas/expense.py](file:///home/snraw/Programming/Hangouts/server/app/schemas/expense.py)
- `[NEW]` [server/app/services/expenses.py](file:///home/snraw/Programming/Hangouts/server/app/services/expenses.py)
- `[NEW]` [server/app/api/v1/expenses.py](file:///home/snraw/Programming/Hangouts/server/app/api/v1/expenses.py)
- `[MODIFY]` [server/app/api/v1/router.py](file:///home/snraw/Programming/Hangouts/server/app/api/v1/router.py)
- `[NEW]` [server/tests/api/test_expenses.py](file:///home/snraw/Programming/Hangouts/server/tests/api/test_expenses.py)

#### 📌 Requirements & Endpoints
Implement expense logging and settlement calculations using `expenses` table in [server/schema.sql](file:///home/snraw/Programming/Hangouts/server/schema.sql#L97-L106).

- `POST /api/v1/hangouts/{id}/expenses`: Log an expense (`description`, `total_amount`, `paid_by`, `split_type`).
- `GET /api/v1/hangouts/{id}/expenses`: List logged expenses.
- `GET /api/v1/hangouts/{id}/expenses/summary`: Return total cost, per-person share (equal split), and individual member net balances (`owes` / `is_owed`).
- `DELETE /api/v1/expenses/{expense_id}`: Delete an expense record.

#### ✅ Acceptance Criteria
- Settlement summary accurately calculates equal split based on total participants.
- Pytest coverage in `test_expenses.py` validating expense logging, equal split math, and balance summaries.

---

## Task 7 [DONE - ✅]
### Frontend Foundation: API Client & Auth Context
**Prerequisites**: None

#### 🎯 Target Files
- `[NEW]` [client/src/lib/api.ts](file:///home/snraw/Programming/Hangouts/client/src/lib/api.ts)
- `[NEW]` [client/src/context/AuthContext.tsx](file:///home/snraw/Programming/Hangouts/client/src/context/AuthContext.tsx)
- `[NEW]` [client/src/components/ProtectedRoute.tsx](file:///home/snraw/Programming/Hangouts/client/src/components/ProtectedRoute.tsx)
- `[MODIFY]` [client/src/pages/_app.tsx](file:///home/snraw/Programming/Hangouts/client/src/pages/_app.tsx)
- `[MODIFY]` [client/src/pages/index.tsx](file:///home/snraw/Programming/Hangouts/client/src/pages/index.tsx)

#### 📌 Requirements
- Build `api.ts` with Axios/Fetch wrapper pointing to `NEXT_PUBLIC_API_URL` (default `http://localhost:8000/api/v1`).
- Intercept requests to attach `Authorization: Bearer <token>` header from local storage or cookie.
- Build `AuthContext` providing `user`, `token`, `login()`, `signup()`, and `logout()`.
- Update [client/src/pages/index.tsx](file:///home/snraw/Programming/Hangouts/client/src/pages/index.tsx) to submit auth requests to `POST /api/v1/auth/signup` and `POST /api/v1/auth/login`.

#### ✅ Acceptance Criteria
- Successful login stores token and redirects to `/timeline`.
- Unauthenticated users attempting to visit protected pages are redirected to `/`.
- Frontend auth flow integration verified with live token persistence tests.

---

## Task 8 [TODO - ❌]
### Frontend Views: Dedicated Notes Page & Groups UI
**Prerequisites**: Task 5 (Backend API: Hangout Notes), Task 7 (Frontend Foundation: API Client & Auth Context)

#### 🎯 Target Files
- `[NEW]` [client/src/pages/notes.tsx](file:///home/snraw/Programming/Hangouts/client/src/pages/notes.tsx)
- `[NEW]` [client/src/pages/groups.tsx](file:///home/snraw/Programming/Hangouts/client/src/pages/groups.tsx)
- `[MODIFY]` [client/src/components/Layout.tsx](file:///home/snraw/Programming/Hangouts/client/src/components/Layout.tsx#L18)

#### 📌 Requirements
- Build `client/src/pages/notes.tsx` fetching notes from `GET /api/v1/notes/my-notes` to resolve 404 error when clicking "Notes" in [Layout.tsx](file:///home/snraw/Programming/Hangouts/client/src/components/Layout.tsx#L18).
- Build `client/src/pages/groups.tsx`: List user groups (`GET /api/v1/groups`), create new group modal (`POST /api/v1/groups`), and member invite controls (`POST /api/v1/groups/{id}/members`).

#### ✅ Acceptance Criteria
- Clicking "Notes" in navigation renders user's compiled notes without 404 errors.
- Groups can be created and managed via `/groups`.
- UI rendering and API response handling verified for empty and populated states.

---

## Task 9 [PARTIAL - ⚠️]
### Frontend Integration: Profile Page & BYOS Modal
**Prerequisites**: Task 4 (Backend API: Storage Quota & BYOS Link Integration), Task 7 (Frontend Foundation: API Client & Auth Context)

#### 🎯 Target Files
- `[MODIFY]` [client/src/pages/profile.tsx](file:///home/snraw/Programming/Hangouts/client/src/pages/profile.tsx)

#### 📌 Requirements
- Replace hardcoded profile data with live data fetched from `GET /api/v1/profiles/me` ✅.
- Wire profile edit form to send `PATCH /api/v1/profiles/me` ❌.
- Connect storage meter to `GET /api/v1/storage/usage` and BYOS provider modal to `POST /api/v1/storage/byos/link` ❌.

#### ✅ Acceptance Criteria
- Profile updates persist and display updated display name and avatar URL.
- Storage meter dynamically displays current storage consumption vs quota.

---

## Task 10 [TODO - ❌]
### Frontend Integration: Timeline Feed & Memories Card
**Prerequisites**: Task 1 (Backend API: Hangouts CRUD & Participants), Task 2 (Backend API: Spatial Map Query & Memories Endpoint), Task 7 (Frontend Foundation: API Client & Auth Context)

#### 🎯 Target Files
- `[MODIFY]` [client/src/pages/timeline.tsx](file:///home/snraw/Programming/Hangouts/client/src/pages/timeline.tsx)

#### 📌 Requirements
- Replace static `useState` hangouts array with live API call to `GET /api/v1/hangouts`.
- Connect top search bar (`q`), date filter (`date`), and group filter chips (`group_id`) to trigger filtered API fetches.
- Connect "On This Day" memory hero card to `GET /api/v1/memories/on-this-day`.

#### ✅ Acceptance Criteria
- Timeline loads real hangouts from backend server.
- Searching by title/location dynamically filters results via `q`.
- Live feed search and date filtering response validated against backend endpoints.

---

## Task 11 [TODO - ❌]
### Frontend Integration: Create Hangout Form
**Prerequisites**: Task 1 (Backend API: Hangouts CRUD & Participants), Task 7 (Frontend Foundation: API Client & Auth Context)

#### 🎯 Target Files
- `[MODIFY]` [client/src/pages/create.tsx](file:///home/snraw/Programming/Hangouts/client/src/pages/create.tsx)

#### 📌 Requirements
- Fetch available user groups (`GET /api/v1/groups`) for optional group selection dropdown.
- On form submit, post data to `POST /api/v1/hangouts`.
- Support cover photo file selection and location coordinate input.

#### ✅ Acceptance Criteria
- Submitting form creates a new database record and redirects to `/hangout/{id}`.
- Validation handles required fields (title, date) and displays user-friendly API error toasts.

---

## Task 12 [DONE - ✅]
### Frontend Integration: Interactive Map Provider
**Prerequisites**: Task 2 (Backend API: Spatial Map Query & Memories Endpoint), Task 7 (Frontend Foundation: API Client & Auth Context)

#### 🎯 Target Files
- `[MODIFY]` [client/src/pages/map.tsx](file:///home/snraw/Programming/Hangouts/client/src/pages/map.tsx)
- `[NEW]` [client/src/components/MapComponent.tsx](file:///home/snraw/Programming/Hangouts/client/src/components/MapComponent.tsx)

#### 📌 Requirements
- Replace SVG static placeholder map with interactive Leaflet + CartoDB Voyager map tiles ✅.
- Fetch pin coordinates dynamically from `GET /api/v1/hangouts/map` ✅.
- Render location markers with popups / bottom sheet detail triggers ✅.

#### ✅ Acceptance Criteria
- Pins render on real map tiles at exact latitude/longitude coordinates.
- Map pin clicks display matching hangout metadata card and link to `/hangout/{id}`.

---

## Task 13 [TODO - ❌]
### Frontend Integration: Hangout Detail Page Tabs
**Prerequisites**: Task 1 (Backend API: Hangouts CRUD & Participants), Task 3 (Backend API: Gallery & Photo Management), Task 5 (Backend API: Hangout Notes), Task 6 (Backend API: Expenses & Equal Split Settlement), Task 7 (Frontend Foundation: API Client & Auth Context)

#### 🎯 Target Files
- `[MODIFY]` [client/src/pages/hangout/[id].tsx](file:///home/snraw/Programming/Hangouts/client/src/pages/hangout/[id].tsx)

#### 📌 Requirements
- **Overview Tab**: Load details (`GET /api/v1/hangouts/{id}`) and rating system (`POST /api/v1/hangouts/{id}/ratings`).
- **Gallery Tab**: Wire photo dropzone upload form to `POST /api/v1/hangouts/{id}/photos` and gallery grid to `GET /api/v1/hangouts/{id}/photos`.
- **Expenses Tab**: Wire expense log form (`POST /api/v1/hangouts/{id}/expenses`) and render settlement summary cards from `GET /api/v1/hangouts/{id}/expenses/summary`.
- **Notes Tab**: Wire note creation form and list to `/api/v1/hangouts/{id}/notes` with shared/private toggle.

#### ✅ Acceptance Criteria
- All 4 tabs interact seamlessly with backend endpoints.
- End-to-end user workflows (photo upload, expense split calculation, note creation, rating submission) verified against live API responses.
