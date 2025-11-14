from django.contrib import admin
from .models import (
    LMSIntegration,
    ZoomIntegration,
    GoogleClassroomIntegration,
    CourseIntegration,
    ZoomMeeting,
)


@admin.register(LMSIntegration)
class LMSIntegrationAdmin(admin.ModelAdmin):
    list_display = ('user', 'integration_type', 'is_active', 'created_at')
    list_filter = ('integration_type', 'is_active', 'created_at')
    search_fields = ('user__username', 'user__email')


@admin.register(ZoomIntegration)
class ZoomIntegrationAdmin(admin.ModelAdmin):
    list_display = ('lms_integration', 'account_id', 'client_id')
    search_fields = ('lms_integration__user__username', 'account_id')


@admin.register(GoogleClassroomIntegration)
class GoogleClassroomIntegrationAdmin(admin.ModelAdmin):
    list_display = ('lms_integration', 'classroom_id', 'client_id')
    search_fields = ('lms_integration__user__username', 'classroom_id')


@admin.register(CourseIntegration)
class CourseIntegrationAdmin(admin.ModelAdmin):
    list_display = ('course', 'lms_integration', 'external_id', 'auto_sync', 'synced_at')
    list_filter = ('auto_sync', 'synced_at')
    search_fields = ('course__title', 'external_id')


@admin.register(ZoomMeeting)
class ZoomMeetingAdmin(admin.ModelAdmin):
    list_display = ('topic', 'course', 'start_time', 'duration_minutes', 'meeting_id')
    list_filter = ('start_time', 'course')
    search_fields = ('topic', 'meeting_id', 'course__title')
