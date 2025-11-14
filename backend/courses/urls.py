from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CourseViewSet,
    CourseModuleViewSet,
    LessonViewSet,
    AssignmentViewSet,
    AssignmentSubmissionViewSet,
    QuizViewSet,
    QuizSubmissionViewSet,
    QuestionBankEntryViewSet,
    EnrollmentViewSet,
    WishlistViewSet,
    InstructorAnalyticsView,
    AdminAnalyticsView,
)

router = DefaultRouter()
router.register(r'courses', CourseViewSet, basename='course')
router.register(r'modules', CourseModuleViewSet, basename='module')
router.register(r'lessons', LessonViewSet, basename='lesson')
router.register(r'assignments', AssignmentViewSet, basename='assignment')
router.register(r'assignment-submissions', AssignmentSubmissionViewSet, basename='assignment-submission')
router.register(r'quizzes', QuizViewSet, basename='quiz')
router.register(r'quiz-submissions', QuizSubmissionViewSet, basename='quiz-submission')
router.register(r'question-bank', QuestionBankEntryViewSet, basename='question-bank')
router.register(r'enrollments', EnrollmentViewSet, basename='enrollment')
router.register(r'wishlist', WishlistViewSet, basename='wishlist')

urlpatterns = [
    path('', include(router.urls)),
    path('analytics/instructor/', InstructorAnalyticsView.as_view(), name='analytics-instructor'),
    path('analytics/admin/', AdminAnalyticsView.as_view(), name='analytics-admin'),
]

