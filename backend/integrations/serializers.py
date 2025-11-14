from rest_framework import serializers
from accounts.serializers import UserSerializer
from courses.serializers import CourseSerializer, LessonSerializer
from courses.models import Course, Lesson
from .models import (
    LMSIntegration,
    ZoomIntegration,
    GoogleClassroomIntegration,
    CourseIntegration,
    ZoomMeeting,
)


class ZoomIntegrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ZoomIntegration
        fields = (
            'id',
            'api_key',
            'api_secret',
            'account_id',
            'client_id',
            'client_secret',
            'access_token',
            'refresh_token',
            'token_expires_at',
        )
        extra_kwargs = {
            'api_secret': {'write_only': True},
            'client_secret': {'write_only': True},
            'access_token': {'write_only': True},
            'refresh_token': {'write_only': True},
        }


class GoogleClassroomIntegrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = GoogleClassroomIntegration
        fields = (
            'id',
            'client_id',
            'client_secret',
            'access_token',
            'refresh_token',
            'token_expires_at',
            'classroom_id',
        )
        extra_kwargs = {
            'client_secret': {'write_only': True},
            'access_token': {'write_only': True},
            'refresh_token': {'write_only': True},
        }


class LMSIntegrationSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    zoom_settings = ZoomIntegrationSerializer(read_only=True)
    google_classroom_settings = GoogleClassroomIntegrationSerializer(read_only=True)

    class Meta:
        model = LMSIntegration
        fields = (
            'id',
            'user',
            'integration_type',
            'is_active',
            'created_at',
            'updated_at',
            'zoom_settings',
            'google_classroom_settings',
        )
        read_only_fields = ('created_at', 'updated_at', 'user')


class CourseIntegrationSerializer(serializers.ModelSerializer):
    course = CourseSerializer(read_only=True)
    course_id = serializers.PrimaryKeyRelatedField(
        queryset=Course.objects.all(),
        source='course',
        write_only=True
    )
    lms_integration = LMSIntegrationSerializer(read_only=True)
    lms_integration_id = serializers.PrimaryKeyRelatedField(
        queryset=LMSIntegration.objects.all(),
        source='lms_integration',
        write_only=True
    )

    class Meta:
        model = CourseIntegration
        fields = (
            'id',
            'course',
            'course_id',
            'lms_integration',
            'lms_integration_id',
            'external_id',
            'external_url',
            'synced_at',
            'auto_sync',
        )
        read_only_fields = ('synced_at',)


class ZoomMeetingSerializer(serializers.ModelSerializer):
    course = CourseSerializer(read_only=True)
    course_id = serializers.PrimaryKeyRelatedField(
        queryset=Course.objects.all(),
        source='course',
        write_only=True,
        required=False,
        allow_null=True
    )
    lesson = LessonSerializer(read_only=True)
    lesson_id = serializers.PrimaryKeyRelatedField(
        queryset=Lesson.objects.all(),
        source='lesson',
        write_only=True,
        required=False,
        allow_null=True
    )
    zoom_integration = ZoomIntegrationSerializer(read_only=True)
    zoom_integration_id = serializers.PrimaryKeyRelatedField(
        queryset=ZoomIntegration.objects.all(),
        source='zoom_integration',
        write_only=True
    )

    class Meta:
        model = ZoomMeeting
        fields = (
            'id',
            'course',
            'course_id',
            'lesson',
            'lesson_id',
            'zoom_integration',
            'zoom_integration_id',
            'meeting_id',
            'meeting_url',
            'topic',
            'start_time',
            'duration_minutes',
            'password',
            'join_url',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('meeting_id', 'meeting_url', 'join_url', 'created_at', 'updated_at')

