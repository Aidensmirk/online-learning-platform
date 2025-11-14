# Migration from Firebase to Django Backend

This document outlines the migration from Firebase to Django REST API backend.

## What Has Been Completed

### Backend (Django)
✅ Complete Django project structure with REST API
✅ Custom User model with role support (student/instructor)
✅ Course, Enrollment, and Wishlist models
✅ JWT authentication setup
✅ CORS configuration for React frontend
✅ File upload handling for course thumbnails
✅ API endpoints for:
   - User registration and authentication
   - Course CRUD operations
   - Enrollment management
   - Wishlist functionality

### Frontend (React)
✅ New API service layer (`src/Services/api.js`) to replace Firebase calls
✅ Updated `authService.js` to use Django API
✅ Updated `ProtectedRoute` component for JWT authentication
✅ Updated `Register` component
✅ Updated `Login1` component
✅ Updated `CreateCourse` component
✅ Updated `AllCourses` component

## Components Still Using Firebase

The following components still need to be updated to use the Django API:

1. **StudentDashboard.jsx** - Needs to fetch enrollments from API
2. **InstructorDashboard.jsx** - Needs to fetch instructor's courses from API
3. **CourseDetails.jsx** - Needs to fetch course details and handle enrollment
4. **CoursePlayer.jsx** - Needs to update progress via API
5. **MyCourses.jsx** - Needs to fetch enrolled courses from API
6. **ManageCourses.jsx** - Needs to fetch and manage courses via API
7. **EditCourse.jsx** - Needs to update course via API
8. **Wishlist.jsx** - Needs to fetch wishlist from API
9. **Profile.jsx** - Needs to update user profile via API
10. **PaymentPage.jsx** - May need payment integration updates

## How to Update Remaining Components

### Pattern for Updating Components

1. **Remove Firebase imports:**
```javascript
// Remove these
import { db, auth, storage } from '../Services/firebase';
import { collection, getDocs, ... } from 'firebase/firestore';
```

2. **Add API imports:**
```javascript
import { coursesAPI, enrollmentsAPI, wishlistAPI, authAPI } from '../Services/api';
```

3. **Replace Firebase calls with API calls:**
```javascript
// Old Firebase way
const querySnapshot = await getDocs(collection(db, "courses"));
const courses = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

// New Django API way
const courses = await coursesAPI.getAll();
```

4. **Update data structure:**
   - Firebase uses `doc.id` and `doc.data()`
   - Django API returns objects directly with `id` field
   - Thumbnail URLs need to be prefixed with Django media URL if relative

### Example: Updating a Component

**Before (Firebase):**
```javascript
useEffect(() => {
  const fetchCourses = async () => {
    const querySnapshot = await getDocs(collection(db, "courses"));
    const courses = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setCourses(courses);
  };
  fetchCourses();
}, []);
```

**After (Django API):**
```javascript
useEffect(() => {
  const fetchCourses = async () => {
    try {
      const response = await coursesAPI.getAll();
      setCourses(response.results || response);
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };
  fetchCourses();
}, []);
```

## API Endpoints Reference

### Authentication
- `POST /api/auth/register/` - Register
- `POST /api/auth/login/` - Login
- `GET /api/auth/me/` - Get current user
- `PUT /api/auth/profile/` - Update profile

### Courses
- `GET /api/courses/` - List courses
- `GET /api/courses/{id}/` - Get course details
- `POST /api/courses/` - Create course
- `PUT /api/courses/{id}/` - Update course
- `DELETE /api/courses/{id}/` - Delete course
- `POST /api/courses/{id}/enroll/` - Enroll in course
- `POST /api/courses/{id}/add_to_wishlist/` - Add to wishlist
- `DELETE /api/courses/{id}/remove_from_wishlist/` - Remove from wishlist

### Enrollments
- `GET /api/enrollments/` - Get user enrollments

### Wishlist
- `GET /api/wishlist/` - Get user wishlist

## Important Notes

1. **Authentication**: JWT tokens are stored in `localStorage` as `access_token` and `refresh_token`
2. **User Object**: Stored in `localStorage` as `user` (JSON string)
3. **Media Files**: Thumbnail URLs from Django need to be prefixed with `http://localhost:8000` if relative
4. **Error Handling**: API errors have `error.response.data` structure
5. **Pagination**: Some endpoints may return paginated results with `results` array

## Next Steps

1. Update remaining React components to use Django API
2. Test all functionality end-to-end
3. Remove Firebase dependencies from `package.json` (optional)
4. Update environment variables if needed for production
5. Add error handling and loading states where missing
6. Consider adding React Query or similar for better data management

## Testing the Migration

1. Start Django backend: `cd backend && python manage.py runserver`
2. Start React frontend: `npm run dev`
3. Test user registration and login
4. Test course creation (as instructor)
5. Test course enrollment (as student)
6. Test wishlist functionality
7. Test all dashboard views

