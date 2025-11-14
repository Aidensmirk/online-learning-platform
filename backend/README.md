# Django Backend for Online Learning Platform

This is the Django REST API backend for the online learning platform.

## Setup Instructions

### 1. Create a Virtual Environment

```bash
cd backend
python -m venv venv
```

### 2. Activate Virtual Environment

**Windows:**
```bash
venv\Scripts\activate
```

**Linux/Mac:**
```bash
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Run Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### 5. Create a Superuser (Optional)

```bash
python manage.py createsuperuser
```

### 6. Run the Development Server

```bash
python manage.py runserver
```

The API will be available at `http://localhost:8000`

## API Endpoints

### Authentication
- `POST /api/auth/register/` - Register a new user
- `POST /api/auth/login/` - Login
- `GET /api/auth/me/` - Get current user
- `PUT /api/auth/profile/` - Update user profile
- `POST /api/auth/token/refresh/` - Refresh JWT token

### Courses
- `GET /api/courses/` - List all published courses
- `GET /api/courses/{id}/` - Get course details
- `POST /api/courses/` - Create a new course (authenticated)
- `PUT /api/courses/{id}/` - Update course (authenticated, instructor only)
- `DELETE /api/courses/{id}/` - Delete course (authenticated, instructor only)
- `POST /api/courses/{id}/enroll/` - Enroll in a course
- `POST /api/courses/{id}/add_to_wishlist/` - Add to wishlist
- `DELETE /api/courses/{id}/remove_from_wishlist/` - Remove from wishlist

### Enrollments
- `GET /api/enrollments/` - Get user's enrollments

### Wishlist
- `GET /api/wishlist/` - Get user's wishlist

## Database Models

- **User**: Custom user model with role (student/instructor)
- **Course**: Course information with instructor, thumbnail, price, etc.
- **CourseContent**: Course lessons/content
- **Enrollment**: Student enrollments in courses
- **Wishlist**: Student wishlist items

## Notes

- The backend uses JWT authentication
- CORS is configured to allow requests from the React frontend
- Media files (thumbnails, profile pictures) are stored in the `media/` directory
- The API uses Django REST Framework with pagination

