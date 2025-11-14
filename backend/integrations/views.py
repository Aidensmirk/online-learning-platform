from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django.utils import timezone
from accounts.permissions import IsInstructorOrAdmin
from .models import (
    LMSIntegration,
    ZoomIntegration,
    GoogleClassroomIntegration,
    CourseIntegration,
    ZoomMeeting,
)
from .serializers import (
    LMSIntegrationSerializer,
    ZoomIntegrationSerializer,
    GoogleClassroomIntegrationSerializer,
    CourseIntegrationSerializer,
    ZoomMeetingSerializer,
)


class LMSIntegrationViewSet(viewsets.ModelViewSet):
    serializer_class = LMSIntegrationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return LMSIntegration.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def configure_zoom(self, request, pk=None):
        """Configure Zoom integration settings"""
        integration = self.get_object()
        if integration.user != request.user:
            raise PermissionDenied("You can only configure your own integrations.")

        if integration.integration_type != 'zoom':
            return Response(
                {'detail': 'This integration is not a Zoom integration.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        zoom_settings, created = ZoomIntegration.objects.get_or_create(
            lms_integration=integration
        )
        serializer = ZoomIntegrationSerializer(zoom_settings, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def configure_google_classroom(self, request, pk=None):
        """Configure Google Classroom integration settings"""
        integration = self.get_object()
        if integration.user != request.user:
            raise PermissionDenied("You can only configure your own integrations.")

        if integration.integration_type != 'google_classroom':
            return Response(
                {'detail': 'This integration is not a Google Classroom integration.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        google_settings, created = GoogleClassroomIntegration.objects.get_or_create(
            lms_integration=integration
        )
        serializer = GoogleClassroomIntegrationSerializer(google_settings, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CourseIntegrationViewSet(viewsets.ModelViewSet):
    serializer_class = CourseIntegrationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = CourseIntegration.objects.select_related('course', 'lms_integration')
        
        # Filter by course if provided
        course_id = self.request.query_params.get('course')
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        
        # Only show integrations for courses the user owns or is enrolled in
        if user.role == 'admin':
            return queryset
        elif user.role == 'instructor':
            return queryset.filter(course__instructor=user)
        else:
            # Students can only see integrations for courses they're enrolled in
            from courses.models import Enrollment
            enrolled_courses = Enrollment.objects.filter(student=user).values_list('course_id', flat=True)
            return queryset.filter(course_id__in=enrolled_courses)

    def perform_create(self, serializer):
        course = serializer.validated_data['course']
        lms_integration = serializer.validated_data['lms_integration']
        
        # Verify user has permission
        if self.request.user.role != 'admin' and course.instructor != self.request.user:
            raise PermissionDenied("You can only create integrations for your own courses.")
        
        if lms_integration.user != self.request.user:
            raise PermissionDenied("You can only use your own LMS integrations.")
        
        serializer.save()


class ZoomMeetingViewSet(viewsets.ModelViewSet):
    serializer_class = ZoomMeetingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = ZoomMeeting.objects.select_related('course', 'zoom_integration')
        
        # Filter by course if provided
        course_id = self.request.query_params.get('course')
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        
        # Only show meetings for courses the user owns or is enrolled in
        if user.role == 'admin':
            return queryset
        elif user.role == 'instructor':
            return queryset.filter(course__instructor=user)
        else:
            # Students can only see meetings for courses they're enrolled in
            from courses.models import Enrollment
            enrolled_courses = Enrollment.objects.filter(student=user).values_list('course_id', flat=True)
            return queryset.filter(course_id__in=enrolled_courses)

    def perform_create(self, serializer):
        zoom_integration = serializer.validated_data['zoom_integration']
        
        # Verify user owns the integration
        if zoom_integration.lms_integration.user != self.request.user:
            raise PermissionDenied("You can only create meetings with your own Zoom integration.")
        
        # Create a placeholder meeting (in production, this would call Zoom API)
        meeting_data = serializer.validated_data
        meeting = serializer.save(
            meeting_id=f"zoom_{timezone.now().timestamp()}",
            meeting_url=f"https://zoom.us/j/{meeting_data.get('meeting_id', 'placeholder')}",
            join_url=f"https://zoom.us/j/{meeting_data.get('meeting_id', 'placeholder')}"
        )
        
        # In production, you would call Zoom API here:
        # from .services import create_zoom_meeting
        # zoom_meeting = create_zoom_meeting(zoom_integration, meeting_data)
        # meeting.meeting_id = zoom_meeting['id']
        # meeting.meeting_url = zoom_meeting['join_url']
        # meeting.join_url = zoom_meeting['join_url']
        # meeting.save()
