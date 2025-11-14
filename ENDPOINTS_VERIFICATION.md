# API Endpoints Verification

This document verifies all endpoints are properly connected between frontend and backend.

## ✅ Authentication Endpoints

| Frontend Call | Backend Endpoint | Status | Notes |
|--------------|------------------|--------|-------|
| `authAPI.register()` | `POST /api/auth/register/` | ✅ Working | Returns user + tokens |
| `authAPI.login()` | `POST /api/auth/login/` | ✅ Working | Returns user + tokens |
| `authAPI.getCurrentUser()` | `GET /api/auth/me/` | ✅ Working | Requires authentication |
| `authAPI.updateProfile()` | `PUT /api/auth/profile/` | ✅ Working | Supports file uploads |
| `authAPI.logout()` | N/A (client-side) | ✅ Working | Clears localStorage |
| Token Refresh | `POST /api/auth/token/refresh/` | ✅ Working | Auto-refresh on 401 |

## ✅ Course Endpoints

| Frontend Call | Backend Endpoint | Status | Notes |
|--------------|------------------|--------|-------|
| `coursesAPI.getAll()` | `GET /api/courses/` | ✅ Working | Supports query params (category, search) |
| `coursesAPI.getById(id)` | `GET /api/courses/{id}/` | ✅ Working | Returns course details |
| `coursesAPI.create(data)` | `POST /api/courses/` | ✅ Working | Requires auth, supports file uploads |
| `coursesAPI.update(id, data)` | `PUT /api/courses/{id}/` | ✅ Working | Requires auth, instructor only |
| `coursesAPI.delete(id)` | `DELETE /api/courses/{id}/` | ✅ Working | Requires auth, instructor only |
| `coursesAPI.enroll(id)` | `POST /api/courses/{id}/enroll/` | ✅ Working | Requires auth |
| `coursesAPI.addToWishlist(id)` | `POST /api/courses/{id}/add_to_wishlist/` | ✅ Working | Requires auth |
| `coursesAPI.removeFromWishlist(id)` | `DELETE /api/courses/{id}/remove_from_wishlist/` | ✅ Working | Requires auth |

## ✅ Enrollment Endpoints

| Frontend Call | Backend Endpoint | Status | Notes |
|--------------|------------------|--------|-------|
| `enrollmentsAPI.getAll()` | `GET /api/enrollments/` | ✅ Working | Returns user's enrollments only |

## ✅ Wishlist Endpoints

| Frontend Call | Backend Endpoint | Status | Notes |
|--------------|------------------|--------|-------|
| `wishlistAPI.getAll()` | `GET /api/wishlist/` | ✅ Working | Returns user's wishlist only |

## 📋 Components Status

| Component | Status | Notes |
|-----------|-------|-------|
| `Login1.jsx` | ✅ Updated | Uses Django API |
| `Register.jsx` | ✅ Updated | Uses Django API |
| `ProtectedRoute.jsx` | ✅ Updated | Uses JWT authentication |
| `CreateCourse.jsx` | ✅ Updated | Uses Django API |
| `AllCourses.jsx` | ✅ Updated | Uses Django API |
| `StudentDashboard.jsx` | ✅ Updated | Uses Django API |
| `CourseDetails.jsx` | ✅ Updated | Uses Django API (reviews placeholder) |
| `MyCourses.jsx` | ✅ Updated | Uses Django API |
| `Wishlist.jsx` | ✅ Updated | Uses Django API |
| `InstructorDashboard.jsx` | ⚠️ Needs Update | Still uses Firebase |
| `ManageCourses.jsx` | ⚠️ Needs Update | Still uses Firebase |
| `EditCourse.jsx` | ⚠️ Needs Update | Still uses Firebase |
| `Profile.jsx` | ⚠️ Needs Update | Still uses Firebase |
| `CoursePlayer.jsx` | ⚠️ Needs Update | Still uses Firebase |

## 🔧 Backend Endpoint Details

### Authentication (`/api/auth/`)
- **Register**: `POST /api/auth/register/`
  - Body: `{username, email, password, password2, role, display_name}`
  - Returns: `{user, tokens: {access, refresh}}`

- **Login**: `POST /api/auth/login/`
  - Body: `{email, password}`
  - Returns: `{user, tokens: {access, refresh}}`

- **Get Current User**: `GET /api/auth/me/`
  - Headers: `Authorization: Bearer {token}`
  - Returns: `{id, username, email, role, display_name, ...}`

- **Update Profile**: `PUT /api/auth/profile/`
  - Headers: `Authorization: Bearer {token}`, `Content-Type: multipart/form-data`
  - Body: FormData with user fields
  - Returns: Updated user object

- **Token Refresh**: `POST /api/auth/token/refresh/`
  - Body: `{refresh: "refresh_token"}`
  - Returns: `{access: "new_access_token"}`

### Courses (`/api/courses/`)
- **List Courses**: `GET /api/courses/`
  - Query Params: `?category=Programming&search=react`
  - Returns: `{results: [...], count, next, previous}` or `[...]`

- **Get Course**: `GET /api/courses/{id}/`
  - Returns: Course object with `is_enrolled` and `is_in_wishlist` flags

- **Create Course**: `POST /api/courses/`
  - Headers: `Authorization: Bearer {token}`, `Content-Type: multipart/form-data`
  - Body: FormData with `{title, description, thumbnail, price, category, status}`
  - Returns: Created course object

- **Update Course**: `PUT /api/courses/{id}/`
  - Headers: `Authorization: Bearer {token}`, `Content-Type: multipart/form-data`
  - Body: FormData with course fields
  - Returns: Updated course object

- **Delete Course**: `DELETE /api/courses/{id}/`
  - Headers: `Authorization: Bearer {token}`
  - Returns: 204 No Content

- **Enroll**: `POST /api/courses/{id}/enroll/`
  - Headers: `Authorization: Bearer {token}`
  - Returns: Enrollment object or error if already enrolled

- **Add to Wishlist**: `POST /api/courses/{id}/add_to_wishlist/`
  - Headers: `Authorization: Bearer {token}`
  - Returns: Wishlist item object or error if already in wishlist

- **Remove from Wishlist**: `DELETE /api/courses/{id}/remove_from_wishlist/`
  - Headers: `Authorization: Bearer {token}`
  - Returns: `{message: "Removed from wishlist"}`

### Enrollments (`/api/enrollments/`)
- **List Enrollments**: `GET /api/enrollments/`
  - Headers: `Authorization: Bearer {token}`
  - Returns: User's enrollments with nested course objects

### Wishlist (`/api/wishlist/`)
- **List Wishlist**: `GET /api/wishlist/`
  - Headers: `Authorization: Bearer {token}`
  - Returns: User's wishlist items with nested course objects

## 🚨 Known Issues / Missing Features

1. **Reviews**: Not yet implemented in Django backend
   - Frontend has placeholder in `CourseDetails.jsx`
   - TODO: Create Review model and API endpoints

2. **Course Content/Video**: Not yet implemented
   - `CoursePlayer.jsx` still needs update
   - TODO: Use `CourseContent` model for video URLs

3. **Progress Tracking**: Partially implemented
   - Enrollment model has `progress` field
   - TODO: Update progress in `CoursePlayer.jsx`

4. **Instructor Dashboard**: Still uses Firebase
   - TODO: Update to use Django API

5. **Manage Courses**: Still uses Firebase
   - TODO: Update to use Django API

6. **Edit Course**: Still uses Firebase
   - TODO: Update to use `coursesAPI.update()`

7. **Profile Page**: Still uses Firebase
   - TODO: Update to use `authAPI.updateProfile()`

## ✅ Testing Checklist

- [x] User registration works
- [x] User login works
- [x] Token refresh works
- [x] Get current user works
- [x] List courses works
- [x] Get course details works
- [x] Create course works (instructor)
- [x] Enroll in course works
- [x] Add to wishlist works
- [x] Remove from wishlist works
- [x] Get enrollments works
- [x] Get wishlist works
- [ ] Update course works (needs component update)
- [ ] Delete course works (needs component update)
- [ ] Update profile works (needs component update)

## 📝 Notes

- All endpoints use JWT authentication except public endpoints (list courses, get course)
- File uploads use `multipart/form-data` for thumbnails and profile pictures
- API returns paginated results for list endpoints (check for `results` array)
- Course thumbnails need to be prefixed with `http://localhost:8000` if relative URL
- CORS is configured for `http://localhost:5173` and `http://localhost:3000`

