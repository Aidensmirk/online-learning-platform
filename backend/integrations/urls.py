from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    LMSIntegrationViewSet,
    CourseIntegrationViewSet,
    ZoomMeetingViewSet,
)

router = DefaultRouter()
router.register(r'lms-integrations', LMSIntegrationViewSet, basename='lms-integration')
router.register(r'course-integrations', CourseIntegrationViewSet, basename='course-integration')
router.register(r'zoom-meetings', ZoomMeetingViewSet, basename='zoom-meeting')

urlpatterns = [
    path('', include(router.urls)),
]

