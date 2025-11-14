from django.contrib import admin
from .models import (
    Course,
    CourseModule,
    Lesson,
    Assignment,
    AssignmentSubmission,
    Quiz,
    QuizQuestion,
    QuizChoice,
    QuizSubmission,
    QuizSubmissionAnswer,
    LessonProgress,
    Enrollment,
    Wishlist,
)


class LessonInline(admin.TabularInline):
    model = Lesson
    extra = 0
    ordering = ('order',)


class AssignmentInline(admin.TabularInline):
    model = Assignment
    extra = 0


class QuizInline(admin.TabularInline):
    model = Quiz
    extra = 0


@admin.register(CourseModule)
class CourseModuleAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'order', 'release_date')
    list_filter = ('course',)
    ordering = ('course', 'order')
    inlines = [LessonInline, AssignmentInline, QuizInline]


class CourseModuleInline(admin.TabularInline):
    model = CourseModule
    extra = 0
    ordering = ('order',)


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('title', 'instructor', 'status', 'price', 'created_at')
    list_filter = ('status', 'category', 'created_at')
    search_fields = ('title', 'description', 'instructor__username')
    inlines = [CourseModuleInline]


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ('title', 'module', 'order', 'duration_minutes', 'is_published')
    list_filter = ('module__course', 'is_published')
    search_fields = ('title', 'overview', 'content')
    ordering = ('module', 'order')


@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = ('title', 'module', 'due_date', 'max_points')
    list_filter = ('module__course', 'due_date')
    search_fields = ('title', 'instructions')


@admin.register(AssignmentSubmission)
class AssignmentSubmissionAdmin(admin.ModelAdmin):
    list_display = ('assignment', 'student', 'submitted_at', 'grade', 'status')
    list_filter = ('status', 'submitted_at', 'assignment__module__course')
    search_fields = ('student__username', 'assignment__title')


class QuizChoiceInline(admin.TabularInline):
    model = QuizChoice
    extra = 0


@admin.register(QuizQuestion)
class QuizQuestionAdmin(admin.ModelAdmin):
    list_display = ('quiz', 'order', 'question_type', 'points')
    list_filter = ('quiz__module__course', 'question_type')
    inlines = [QuizChoiceInline]


@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ('title', 'module', 'time_limit_minutes', 'attempts_allowed', 'passing_score')
    list_filter = ('module__course',)
    search_fields = ('title', 'description')
    inlines = []


@admin.register(QuizSubmission)
class QuizSubmissionAdmin(admin.ModelAdmin):
    list_display = ('quiz', 'student', 'submitted_at', 'score', 'passed')
    list_filter = ('passed', 'submitted_at', 'quiz__module__course')
    search_fields = ('student__username', 'quiz__title')


@admin.register(QuizSubmissionAnswer)
class QuizSubmissionAnswerAdmin(admin.ModelAdmin):
    list_display = ('submission', 'question', 'is_correct', 'points_awarded')
    list_filter = ('is_correct', 'question__quiz__module__course')


@admin.register(LessonProgress)
class LessonProgressAdmin(admin.ModelAdmin):
    list_display = ('enrollment', 'lesson', 'completed_at')
    list_filter = ('lesson__module__course', 'completed_at')
    search_fields = ('enrollment__student__username', 'lesson__title')


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ('student', 'course', 'enrolled_at', 'progress', 'last_accessed')
    list_filter = ('enrolled_at', 'course')
    search_fields = ('student__username', 'course__title')


@admin.register(Wishlist)
class WishlistAdmin(admin.ModelAdmin):
    list_display = ('student', 'course', 'added_at')
    list_filter = ('added_at',)
    search_fields = ('student__username', 'course__title')

