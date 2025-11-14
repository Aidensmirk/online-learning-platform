from django.db import models
from django.conf import settings


class Course(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
        ('archived', 'Archived'),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField()
    instructor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='courses'
    )
    thumbnail = models.ImageField(upload_to='course-thumbnails/', blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    category = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    estimated_hours = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    prerequisites = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class CourseModule(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='modules')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=1)
    release_date = models.DateField(blank=True, null=True)

    class Meta:
        ordering = ['order']
        unique_together = ('course', 'order')

    def __str__(self):
        return f"{self.course.title} - Module {self.order}: {self.title}"


class Lesson(models.Model):
    module = models.ForeignKey(CourseModule, on_delete=models.CASCADE, related_name='lessons')
    title = models.CharField(max_length=255)
    overview = models.TextField(blank=True)
    content = models.TextField(blank=True)
    video_url = models.URLField(blank=True)
    resource_link = models.URLField(blank=True)
    order = models.PositiveIntegerField(default=1)
    duration_minutes = models.PositiveIntegerField(default=0)
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order']
        unique_together = ('module', 'order')

    def __str__(self):
        return f"{self.module.title} - Lesson {self.order}: {self.title}"


class Assignment(models.Model):
    module = models.ForeignKey(CourseModule, on_delete=models.CASCADE, related_name='assignments')
    title = models.CharField(max_length=255)
    instructions = models.TextField()
    attachment = models.FileField(upload_to='assignments/', blank=True, null=True)
    due_date = models.DateTimeField(blank=True, null=True)
    max_points = models.PositiveIntegerField(default=100)
    allow_resubmission = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['due_date', 'created_at']

    def __str__(self):
        return f"{self.module.course.title} - Assignment: {self.title}"


class AssignmentSubmission(models.Model):
    STATUS_CHOICES = [
        ('submitted', 'Submitted'),
        ('in_review', 'In Review'),
        ('graded', 'Graded'),
        ('returned', 'Returned'),
    ]

    assignment = models.ForeignKey(
        Assignment, on_delete=models.CASCADE, related_name='submissions'
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='assignment_submissions'
    )
    submitted_at = models.DateTimeField(auto_now_add=True)
    attachment = models.FileField(upload_to='assignment-submissions/', blank=True, null=True)
    text_response = models.TextField(blank=True)
    grade = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    feedback = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='submitted')
    reviewed_at = models.DateTimeField(blank=True, null=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='assignment_reviews',
        blank=True,
        null=True,
    )
    is_late = models.BooleanField(default=False)

    class Meta:
        ordering = ['-submitted_at']
        unique_together = ('assignment', 'student')

    def __str__(self):
        return f"{self.assignment.title} submission by {self.student.username}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if self.assignment.due_date and self.submitted_at:
            is_late = self.submitted_at > self.assignment.due_date
            if self.is_late != is_late:
                AssignmentSubmission.objects.filter(pk=self.pk).update(is_late=is_late)
                self.is_late = is_late


class Quiz(models.Model):
    module = models.ForeignKey(CourseModule, on_delete=models.CASCADE, related_name='quizzes')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    time_limit_minutes = models.PositiveIntegerField(blank=True, null=True)
    attempts_allowed = models.PositiveIntegerField(default=1)
    passing_score = models.PositiveIntegerField(default=70)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.module.course.title} - Quiz: {self.title}"


class QuizQuestion(models.Model):
    QUESTION_TYPES = [
        ('multiple_choice', 'Multiple Choice'),
        ('true_false', 'True / False'),
        ('short_answer', 'Short Answer'),
    ]

    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='questions')
    prompt = models.TextField()
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPES)
    order = models.PositiveIntegerField(default=1)
    points = models.PositiveIntegerField(default=1)

    class Meta:
        ordering = ['order']
        unique_together = ('quiz', 'order')

    def __str__(self):
        return f"{self.quiz.title} - Question {self.order}"


class QuizChoice(models.Model):
    question = models.ForeignKey(QuizQuestion, on_delete=models.CASCADE, related_name='choices')
    text = models.CharField(max_length=255)
    is_correct = models.BooleanField(default=False)

    def __str__(self):
        return f"Choice for {self.question}"


class QuestionBankEntry(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='question_bank_entries',
    )
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='question_bank_entries',
        blank=True,
        null=True,
    )
    title = models.CharField(max_length=255, blank=True)
    prompt = models.TextField()
    question_type = models.CharField(
        max_length=20, choices=QuizQuestion.QUESTION_TYPES, default='multiple_choice'
    )
    points = models.PositiveIntegerField(default=1)
    choices = models.JSONField(default=list, blank=True)
    tags = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.title or self.prompt[:50]} ({self.owner})"


class QuizSubmission(models.Model):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='submissions')
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='quiz_submissions'
    )
    submitted_at = models.DateTimeField(auto_now_add=True)
    score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    passed = models.BooleanField(default=False)
    attempt_number = models.PositiveIntegerField(default=1)

    class Meta:
        ordering = ['-submitted_at']
        unique_together = ('quiz', 'student', 'attempt_number')

    def __str__(self):
        return f"{self.quiz.title} submission by {self.student.username}"


class QuizSubmissionAnswer(models.Model):
    submission = models.ForeignKey(
        QuizSubmission, on_delete=models.CASCADE, related_name='answers'
    )
    question = models.ForeignKey(QuizQuestion, on_delete=models.CASCADE)
    selected_choice = models.ForeignKey(QuizChoice, on_delete=models.SET_NULL, blank=True, null=True)
    text_response = models.TextField(blank=True)
    is_correct = models.BooleanField(default=False)
    points_awarded = models.DecimalField(max_digits=5, decimal_places=2, default=0)

    def __str__(self):
        return f"Answer to {self.question} ({self.submission.student.username})"


class Enrollment(models.Model):
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='enrollments'
    )
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrollments')
    enrolled_at = models.DateTimeField(auto_now_add=True)
    progress = models.IntegerField(default=0)  # Percentage
    last_accessed = models.DateTimeField(blank=True, null=True)

    class Meta:
        unique_together = ['student', 'course']
        ordering = ['-enrolled_at']

    def __str__(self):
        return f"{self.student.username} enrolled in {self.course.title}"

    def recalculate_progress(self):
        from django.db.models import Count

        total_lessons = Lesson.objects.filter(module__course=self.course, is_published=True).count()
        completed = self.lesson_progress.count()
        self.progress = int((completed / total_lessons) * 100) if total_lessons else 0
        self.save(update_fields=['progress'])


class Wishlist(models.Model):
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='wishlist_items'
    )
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='wishlist_items')
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['student', 'course']
        ordering = ['-added_at']

    def __str__(self):
        return f"{self.student.username} wishes {self.course.title}"


class LessonProgress(models.Model):
    enrollment = models.ForeignKey(Enrollment, on_delete=models.CASCADE, related_name='lesson_progress')
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='progress_records')
    completed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('enrollment', 'lesson')
        ordering = ['-completed_at']

    def __str__(self):
        return f"{self.enrollment.student.username} completed {self.lesson.title}"

