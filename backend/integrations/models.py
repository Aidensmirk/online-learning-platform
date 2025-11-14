from django.db import models
from django.conf import settings
from courses.models import Course


class LMSIntegration(models.Model):
    """Base model for LMS integrations"""
    INTEGRATION_TYPES = [
        ('zoom', 'Zoom'),
        ('google_classroom', 'Google Classroom'),
        ('microsoft_teams', 'Microsoft Teams'),
        ('canvas', 'Canvas'),
        ('blackboard', 'Blackboard'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='lms_integrations'
    )
    integration_type = models.CharField(max_length=50, choices=INTEGRATION_TYPES)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'integration_type')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.get_integration_type_display()}"


class ZoomIntegration(models.Model):
    """Zoom-specific integration settings"""
    lms_integration = models.OneToOneField(
        LMSIntegration,
        on_delete=models.CASCADE,
        related_name='zoom_settings'
    )
    api_key = models.CharField(max_length=255, blank=True)
    api_secret = models.CharField(max_length=255, blank=True)
    account_id = models.CharField(max_length=255, blank=True)
    client_id = models.CharField(max_length=255, blank=True)
    client_secret = models.CharField(max_length=255, blank=True)
    access_token = models.TextField(blank=True)
    refresh_token = models.TextField(blank=True)
    token_expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Zoom Integration"
        verbose_name_plural = "Zoom Integrations"

    def __str__(self):
        return f"Zoom Integration for {self.lms_integration.user.username}"


class GoogleClassroomIntegration(models.Model):
    """Google Classroom-specific integration settings"""
    lms_integration = models.OneToOneField(
        LMSIntegration,
        on_delete=models.CASCADE,
        related_name='google_classroom_settings'
    )
    client_id = models.CharField(max_length=255, blank=True)
    client_secret = models.CharField(max_length=255, blank=True)
    access_token = models.TextField(blank=True)
    refresh_token = models.TextField(blank=True)
    token_expires_at = models.DateTimeField(null=True, blank=True)
    classroom_id = models.CharField(max_length=255, blank=True)

    class Meta:
        verbose_name = "Google Classroom Integration"
        verbose_name_plural = "Google Classroom Integrations"

    def __str__(self):
        return f"Google Classroom Integration for {self.lms_integration.user.username}"


class CourseIntegration(models.Model):
    """Links courses to LMS integrations"""
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='integrations'
    )
    lms_integration = models.ForeignKey(
        LMSIntegration,
        on_delete=models.CASCADE,
        related_name='courses'
    )
    external_id = models.CharField(max_length=255, blank=True)  # ID in external LMS
    external_url = models.URLField(blank=True)  # URL to course in external LMS
    synced_at = models.DateTimeField(null=True, blank=True)
    auto_sync = models.BooleanField(default=False)

    class Meta:
        unique_together = ('course', 'lms_integration')
        ordering = ['-synced_at']

    def __str__(self):
        return f"{self.course.title} - {self.lms_integration.get_integration_type_display()}"


class ZoomMeeting(models.Model):
    """Stores Zoom meeting information linked to courses/lessons"""
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='zoom_meetings',
        null=True,
        blank=True
    )
    lesson = models.ForeignKey(
        'courses.Lesson',
        on_delete=models.CASCADE,
        related_name='zoom_meetings',
        null=True,
        blank=True
    )
    zoom_integration = models.ForeignKey(
        ZoomIntegration,
        on_delete=models.CASCADE,
        related_name='meetings'
    )
    meeting_id = models.CharField(max_length=255, unique=True)
    meeting_url = models.URLField()
    topic = models.CharField(max_length=255)
    start_time = models.DateTimeField()
    duration_minutes = models.IntegerField(default=60)
    password = models.CharField(max_length=50, blank=True)
    join_url = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-start_time']

    def __str__(self):
        return f"{self.topic} - {self.start_time}"
