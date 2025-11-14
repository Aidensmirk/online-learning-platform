# 🎓 Online Learning Platform (LMS)

A comprehensive, full-stack Learning Management System (LMS) built with React and Django, designed to facilitate online education with advanced features for students, instructors, and administrators.

![Platform Status](https://img.shields.io/badge/status-active-success)
![React](https://img.shields.io/badge/React-18.x-blue)
![Django](https://img.shields.io/badge/Django-5.0-green)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Features Breakdown](#features-breakdown)
- [Screenshots](#screenshots)
- [Future Enhancements](#future-enhancements)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

This Online Learning Platform is a modern, feature-rich LMS that enables educational institutions and instructors to create, manage, and deliver online courses. The platform supports multiple user roles (Students, Instructors, and Administrators) with role-based access control and comprehensive course management capabilities.

### Key Highlights

- ✅ **Full-stack application** with React frontend and Django REST API backend
- ✅ **JWT-based authentication** for secure user sessions
- ✅ **Role-based access control** (Student, Instructor, Admin)
- ✅ **Comprehensive course management** with modules, lessons, assignments, and quizzes
- ✅ **Real-time messaging** between students and instructors
- ✅ **Analytics and reporting** for instructors and administrators
- ✅ **Dark mode support** for better user experience
- ✅ **Responsive design** for mobile and desktop

---

##  Key Features

### 👥 User Management
- **Multi-role system**: Students, Instructors, and Administrators
- **User profiles** with display names, bios, and profile pictures
- **Secure authentication** with JWT tokens
- **Role-based permissions** and access control

### 📚 Course Management
- **Course creation and editing** with rich content support
- **Module organization** for structured learning paths
- **Multimedia lessons** with video support
- **Assignments** with file uploads and grading
- **Interactive quizzes** with multiple question types
- **Question bank** for reusable quiz questions
- **Course status management** (Draft, Published, Archived)

### 📊 Assessments & Grading
- **Assignment submissions** with file attachments
- **Automated quiz grading** for multiple choice and true/false
- **Manual grading** with feedback for assignments
- **Progress tracking** for lessons and courses
- **Attempt limits** and passing scores for quizzes

### 💬 Communication
- **Real-time messaging** between users
- **Course-based conversations** with auto-participant management
- **Message read receipts** and unread counts
- **File attachments** in messages

### 📈 Analytics & Reporting
- **Instructor analytics**: Course performance, enrollments, completion rates
- **Admin analytics**: Platform-wide statistics, revenue tracking
- **Student progress tracking**: Lesson completion, quiz scores
- **Category breakdowns** and engagement metrics

### 🔗 LMS Integrations
- **Zoom integration** for live classes and meetings
- **Google Classroom integration** (framework ready)
- **Course synchronization** with external LMS platforms
- **Meeting scheduling** linked to courses and lessons

### 🎨 User Experience
- **Dark mode** with persistent theme preference
- **Responsive sidebar navigation** with role-based links
- **Modern UI** with glassmorphism effects
- **Smooth animations** and transitions
- **Mobile-friendly** design

---

## 🛠 Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **TailwindCSS** - Utility-first CSS framework
- **Framer Motion** - Animation library

### Backend
- **Django 5.0** - Web framework
- **Django REST Framework** - REST API toolkit
- **djangorestframework-simplejwt** - JWT authentication
- **django-cors-headers** - CORS handling
- **Pillow** - Image processing
- **SQLite** - Database (development)

### Authentication & Security
- **JWT (JSON Web Tokens)** - Stateless authentication
- **Token refresh** mechanism
- **Role-based permissions**
- **CORS configuration** for secure API access

---

## 📁 Project Structure

```
online-learning-platform/
├── backend/                 # Django REST API
│   ├── accounts/           # User authentication & profiles
│   ├── courses/            # Course management
│   ├── messaging/           # Messaging system
│   ├── integrations/        # LMS integrations (Zoom, Google Classroom)
│   ├── learning_platform/   # Django project settings
│   └── manage.py
│
├── src/                     # React frontend
│   ├── components/         # Reusable components
│   │   ├── Navbar.jsx
│   │   ├── Sidebar.jsx
│   │   ├── PageLayout.jsx
│   │   └── ...
│   ├── pages/              # Page components
│   │   ├── Home.jsx
│   │   ├── StudentDashboard.jsx
│   │   ├── InstructorDashboard.jsx
│   │   ├── CoursePlayer.jsx
│   │   ├── ManageCourses.jsx
│   │   └── ...
│   ├── Services/           # API services
│   │   ├── api.js
│   │   └── authService.js
│   ├── context/            # React Context providers
│   │   └── ThemeContext.jsx
│   └── App.jsx
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.8+**
- **Node.js 16+** and npm
- **Git**

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create and activate virtual environment:**
   ```bash
   # Windows
   python -m venv venv
   venv\Scripts\activate

   # Linux/Mac
   python -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run migrations:**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

5. **Create superuser (optional):**
   ```bash
   python manage.py createsuperuser
   ```

6. **Start Django server:**
   ```bash
   python manage.py runserver
   ```

   The API will be available at `http://localhost:8000`

### Frontend Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

   The frontend will be available at `http://localhost:5173`

---

## 📡 API Documentation

### Authentication Endpoints

- `POST /api/auth/register/` - Register a new user
- `POST /api/auth/login/` - Login and get JWT tokens
- `GET /api/auth/me/` - Get current user profile
- `PUT /api/auth/profile/` - Update user profile
- `POST /api/auth/token/refresh/` - Refresh access token

### Course Endpoints

- `GET /api/courses/` - List all published courses
- `GET /api/courses/{id}/` - Get course details
- `POST /api/courses/` - Create a new course (Instructor/Admin)
- `PUT /api/courses/{id}/` - Update course (Instructor/Admin)
- `DELETE /api/courses/{id}/` - Delete course (Instructor/Admin)
- `POST /api/courses/{id}/enroll/` - Enroll in a course
- `POST /api/courses/{id}/add_to_wishlist/` - Add to wishlist
- `DELETE /api/courses/{id}/remove_from_wishlist/` - Remove from wishlist

### Course Content Endpoints

- `GET /api/modules/` - List course modules
- `POST /api/modules/` - Create module
- `GET /api/lessons/` - List lessons
- `POST /api/lessons/` - Create lesson
- `POST /api/lessons/{id}/complete/` - Mark lesson as complete
- `GET /api/assignments/` - List assignments
- `GET /api/quizzes/` - List quizzes
- `POST /api/quizzes/{id}/submit/` - Submit quiz

### Messaging Endpoints

- `GET /api/conversations/` - List user conversations
- `POST /api/conversations/` - Create new conversation
- `GET /api/messages/` - List messages
- `POST /api/messages/` - Send message
- `POST /api/messages/{id}/mark_read/` - Mark message as read

### Analytics Endpoints

- `GET /api/analytics/instructor/` - Instructor analytics
- `GET /api/analytics/admin/` - Admin analytics

### LMS Integration Endpoints

- `GET /api/lms-integrations/` - List user's LMS integrations
- `POST /api/lms-integrations/` - Create LMS integration
- `POST /api/lms-integrations/{id}/configure_zoom/` - Configure Zoom
- `POST /api/zoom-meetings/` - Create Zoom meeting

---

## 🎯 Features Breakdown

### For Students

- ✅ Browse and search courses
- ✅ Enroll in courses
- ✅ Access course content (lessons, videos)
- ✅ Complete assignments and quizzes
- ✅ Track learning progress
- ✅ Message instructors and classmates
- ✅ View grades and feedback
- ✅ Manage wishlist

### For Instructors

- ✅ Create and manage courses
- ✅ Organize content into modules and lessons
- ✅ Create assignments and quizzes
- ✅ Grade student submissions
- ✅ View analytics and course performance
- ✅ Manage question bank
- ✅ Schedule Zoom meetings
- ✅ Communicate with students

### For Administrators

- ✅ Full platform access
- ✅ View platform-wide analytics
- ✅ Monitor user activity
- ✅ Manage all courses and users
- ✅ Access instructor and student features

---

## 📸 Screenshots

### Student Dashboard
- Personalized course recommendations
- Progress tracking
- Quick access to enrolled courses

### Instructor Dashboard
- Course management interface
- Analytics and performance metrics
- Content creation tools

### Course Player
- Video playback
- Lesson navigation
- Assignment and quiz submission
- Progress indicators

---

## 🔮 Future Enhancements

### Planned Features

1. **Reviews & Ratings**
   - Course reviews by students
   - Rating system
   - Review moderation

2. **Payment Integration**
   - Stripe payment gateway
   - Course purchase flow
   - Subscription plans

3. **Google OAuth**
   - Social login with Google
   - Single sign-on (SSO)

4. **Mobile App**
   - React Native application
   - Push notifications
   - Offline content access

5. **Advanced Features**
   - Live streaming integration
   - Discussion forums
   - Certificates generation
   - Email notifications
   - Video conferencing

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👨‍💻 Development Team

Built by Aiden Smirk for online education.

---

## 📞 Support

For questions or support, please open an issue on GitHub or contact the development team.

---

## 🎉 Acknowledgments

- Django REST Framework team
- React community
- All contributors and testers
- Aiden Smirk

---

**Last Updated**: November 2025

**Version**: 1.0.0

---

*This platform is designed to make online learning accessible, engaging, and effective for everyone.*
