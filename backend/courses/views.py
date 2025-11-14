from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import models
from django.db.models import Avg, Count, Sum, Q
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied
from accounts.permissions import IsInstructorOrAdmin, IsAdmin
from accounts.models import User
from .models import (
    Course,
    CourseModule,
    Lesson,
    Assignment,
    AssignmentSubmission,
    Quiz,
    QuizSubmission,
    LessonProgress,
    QuizSubmissionAnswer,
    Enrollment,
    Wishlist,
    QuestionBankEntry,
)
from .serializers import (
    CourseSerializer,
    CourseModuleSerializer,
    LessonSerializer,
    LessonProgressSerializer,
    AssignmentSerializer,
    AssignmentDetailSerializer,
    AssignmentSubmissionSerializer,
    QuizSerializer,
    QuizSubmissionSerializer,
    EnrollmentSerializer,
    WishlistSerializer,
    QuestionBankEntrySerializer,
)


class CourseViewSet(viewsets.ModelViewSet):
    serializer_class = CourseSerializer
    permission_classes = [AllowAny]  # Allow anyone to view courses

    def get_queryset(self):
        base_queryset = Course.objects.all().prefetch_related(
            'modules__lessons',
            'modules__assignments',
            'modules__quizzes__questions__choices'
        )

        # Show published courses to everyone, or draft/archived courses to their instructor
        user = self.request.user
        if user.is_authenticated:
            if user.role == 'student':
                queryset = base_queryset.filter(status='published')
            else:
                queryset = base_queryset.filter(
                    models.Q(status='published')
                    | models.Q(status='draft', instructor=user)
                    | models.Q(status='archived', instructor=user)
                )
        else:
            queryset = base_queryset.filter(status='published')

        category = self.request.query_params.get('category', None)
        search = self.request.query_params.get('search', None)

        if category and category != 'All':
            queryset = queryset.filter(category=category)
        if search:
            queryset = queryset.filter(title__icontains=search)

        return queryset

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsInstructorOrAdmin()]
        return [AllowAny()]

    def perform_create(self, serializer):
        serializer.save(instructor=self.request.user)

    def perform_update(self, serializer):
        course = self.get_object()
        user = self.request.user
        if user.role == "admin" or course.instructor == user:
            serializer.save()
        else:
            raise PermissionDenied("You do not have permission to modify this course.")

    def perform_destroy(self, instance):
        user = self.request.user
        if user.role == "admin" or instance.instructor == user:
            instance.delete()
        else:
            raise PermissionDenied("You do not have permission to delete this course.")

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def enroll(self, request, pk=None):
        course = self.get_object()
        enrollment, created = Enrollment.objects.get_or_create(
            student=request.user,
            course=course
        )
        if created:
            serializer = EnrollmentSerializer(enrollment, context={'request': request})
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response({'message': 'Already enrolled'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def add_to_wishlist(self, request, pk=None):
        course = self.get_object()
        wishlist_item, created = Wishlist.objects.get_or_create(
            student=request.user,
            course=course
        )
        if created:
            serializer = WishlistSerializer(wishlist_item, context={'request': request})
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response({'message': 'Already in wishlist'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['delete'], permission_classes=[IsAuthenticated])
    def remove_from_wishlist(self, request, pk=None):
        course = self.get_object()
        Wishlist.objects.filter(student=request.user, course=course).delete()
        return Response({'message': 'Removed from wishlist'}, status=status.HTTP_200_OK)


class CourseModuleViewSet(viewsets.ModelViewSet):
    serializer_class = CourseModuleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = CourseModule.objects.all()
        course_id = self.request.query_params.get('course')
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        if self.request.user.role != 'admin':
            queryset = queryset.filter(
                models.Q(course__instructor=self.request.user)
                | models.Q(course__status='published')
            )
        return queryset

    def perform_create(self, serializer):
        course = serializer.validated_data['course']
        user = self.request.user
        if user.role == 'admin' or course.instructor == user:
            serializer.save()
        else:
            raise PermissionDenied("You do not have permission to add modules to this course.")

    def perform_update(self, serializer):
        module = self.get_object()
        user = self.request.user
        if user.role == 'admin' or module.course.instructor == user:
            serializer.save()
        else:
            raise PermissionDenied("You do not have permission to modify this module.")

    def perform_destroy(self, instance):
        user = self.request.user
        if user.role == 'admin' or instance.course.instructor == user:
            instance.delete()
        else:
            raise PermissionDenied("You do not have permission to delete this module.")


class LessonViewSet(viewsets.ModelViewSet):
    serializer_class = LessonSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Lesson.objects.all()
        module_id = self.request.query_params.get('module')
        if module_id:
            queryset = queryset.filter(module_id=module_id)
        if self.request.user.role not in ('admin', 'instructor'):
            queryset = queryset.filter(is_published=True)
        return queryset

    def perform_create(self, serializer):
        module = serializer.validated_data['module']
        user = self.request.user
        if user.role == 'admin' or module.course.instructor == user:
            serializer.save()
        else:
            raise PermissionDenied("You do not have permission to add lessons to this module.")

    def perform_update(self, serializer):
        lesson = self.get_object()
        user = self.request.user
        if user.role == 'admin' or lesson.module.course.instructor == user:
            serializer.save()
        else:
            raise PermissionDenied("You do not have permission to modify this lesson.")

    def perform_destroy(self, instance):
        user = self.request.user
        if user.role == 'admin' or instance.module.course.instructor == user:
            instance.delete()
        else:
            raise PermissionDenied("You do not have permission to delete this lesson.")

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def complete(self, request, pk=None):
        lesson = self.get_object()
        enrollment = Enrollment.objects.filter(student=request.user, course=lesson.module.course).first()
        if not enrollment:
            return Response({'detail': 'You are not enrolled in this course.'}, status=status.HTTP_400_BAD_REQUEST)

        progress, created = LessonProgress.objects.get_or_create(enrollment=enrollment, lesson=lesson)
        if created:
            enrollment.recalculate_progress()

        serializer = LessonSerializer(lesson, context={'request': request})
        enrollment_serializer = EnrollmentSerializer(enrollment, context={'request': request})
        return Response(
            {
                'lesson': serializer.data,
                'enrollment': enrollment_serializer.data,
                'completed': True,
            }
        )

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def uncomplete(self, request, pk=None):
        lesson = self.get_object()
        enrollment = Enrollment.objects.filter(student=request.user, course=lesson.module.course).first()
        if not enrollment:
            return Response({'detail': 'You are not enrolled in this course.'}, status=status.HTTP_400_BAD_REQUEST)

        LessonProgress.objects.filter(enrollment=enrollment, lesson=lesson).delete()
        enrollment.recalculate_progress()

        serializer = LessonSerializer(lesson, context={'request': request})
        enrollment_serializer = EnrollmentSerializer(enrollment, context={'request': request})
        return Response(
            {
                'lesson': serializer.data,
                'enrollment': enrollment_serializer.data,
                'completed': False,
            }
        )


class AssignmentViewSet(viewsets.ModelViewSet):
    serializer_class = AssignmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Assignment.objects.select_related('module', 'module__course')
        module_id = self.request.query_params.get('module')
        if module_id:
            queryset = queryset.filter(module_id=module_id)
        if self.request.user.role not in ('admin', 'instructor'):
            queryset = queryset.filter(module__course__enrollments__student=self.request.user).distinct()
        return queryset

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return AssignmentDetailSerializer
        return super().get_serializer_class()

    def perform_create(self, serializer):
        module = serializer.validated_data['module']
        user = self.request.user
        if user.role == 'admin' or module.course.instructor == user:
            serializer.save()
        else:
            raise PermissionDenied("You do not have permission to add assignments to this module.")

    def perform_update(self, serializer):
        assignment = self.get_object()
        user = self.request.user
        if user.role == 'admin' or assignment.module.course.instructor == user:
            serializer.save()
        else:
            raise PermissionDenied("You do not have permission to modify this assignment.")

    def perform_destroy(self, instance):
        user = self.request.user
        if user.role == 'admin' or instance.module.course.instructor == user:
            instance.delete()
        else:
            raise PermissionDenied("You do not have permission to delete this assignment.")


class AssignmentSubmissionViewSet(viewsets.ModelViewSet):
    serializer_class = AssignmentSubmissionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = AssignmentSubmission.objects.select_related('assignment', 'student')
        assignment_id = self.request.query_params.get('assignment')
        if assignment_id:
            queryset = queryset.filter(assignment_id=assignment_id)

        user = self.request.user
        if user.role == 'admin':
            return queryset
        if user.role == 'instructor':
            return queryset.filter(assignment__module__course__instructor=user)
        return queryset.filter(student=user)

    def perform_create(self, serializer):
        assignment = serializer.validated_data['assignment']
        user = self.request.user
        if user.role == 'student':
            serializer.save(student=user, status='submitted')
        elif user.role == 'admin':
            serializer.save()
        else:
            raise PermissionDenied("Only students can submit assignments.")

    def perform_update(self, serializer):
        submission = self.get_object()
        user = self.request.user
        assignment_instructor = submission.assignment.module.course.instructor
        if user.role not in ('admin', 'instructor'):
            raise PermissionDenied("Only instructors can update submissions.")
        if user.role == 'instructor' and user != assignment_instructor:
            raise PermissionDenied("You cannot update this submission.")
        serializer.save(reviewed_by=user, reviewed_at=timezone.now())

    @action(detail=True, methods=['post'], permission_classes=[IsInstructorOrAdmin])
    def grade(self, request, pk=None):
        submission = self.get_object()
        course_instructor = submission.assignment.module.course.instructor
        if request.user.role != 'admin' and request.user != course_instructor:
            raise PermissionDenied("You cannot grade this submission.")

        grade = request.data.get('grade')
        feedback = request.data.get('feedback', '')
        status_value = request.data.get('status', 'graded')

        if grade is None:
            return Response({'detail': 'Grade is required.'}, status=status.HTTP_400_BAD_REQUEST)

        submission.grade = grade
        submission.feedback = feedback
        submission.status = status_value
        submission.reviewed_at = timezone.now()
        submission.reviewed_by = request.user
        submission.save(update_fields=['grade', 'feedback', 'status', 'reviewed_at', 'reviewed_by'])

        serializer = self.get_serializer(submission)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsInstructorOrAdmin])
    def set_status(self, request, pk=None):
        submission = self.get_object()
        course_instructor = submission.assignment.module.course.instructor
        if request.user.role != 'admin' and request.user != course_instructor:
            raise PermissionDenied("You cannot update this submission.")

        status_value = request.data.get('status')
        if status_value not in dict(AssignmentSubmission.STATUS_CHOICES):
            return Response({'detail': 'Invalid status.'}, status=status.HTTP_400_BAD_REQUEST)

        submission.status = status_value
        submission.reviewed_by = request.user
        submission.reviewed_at = timezone.now()
        submission.save(update_fields=['status', 'reviewed_by', 'reviewed_at'])

        serializer = self.get_serializer(submission)
        return Response(serializer.data)


class QuizViewSet(viewsets.ModelViewSet):
    serializer_class = QuizSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Quiz.objects.select_related('module', 'module__course')
        module_id = self.request.query_params.get('module')
        if module_id:
            queryset = queryset.filter(module_id=module_id)
        if self.request.user.role not in ('admin', 'instructor'):
            queryset = queryset.filter(module__course__enrollments__student=self.request.user).distinct()
        return queryset

    def perform_create(self, serializer):
        module = serializer.validated_data['module']
        user = self.request.user
        if user.role == 'admin' or module.course.instructor == user:
            serializer.save()
        else:
            raise PermissionDenied("You do not have permission to add quizzes to this module.")

    def perform_update(self, serializer):
        quiz = self.get_object()
        user = self.request.user
        if user.role == 'admin' or quiz.module.course.instructor == user:
            serializer.save()
        else:
            raise PermissionDenied("You do not have permission to modify this quiz.")

    def perform_destroy(self, instance):
        user = self.request.user
        if user.role == 'admin' or instance.module.course.instructor == user:
            instance.delete()
        else:
            raise PermissionDenied("You do not have permission to delete this quiz.")


class QuizSubmissionViewSet(viewsets.ModelViewSet):
    serializer_class = QuizSubmissionSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'head', 'options']

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def get_queryset(self):
        queryset = QuizSubmission.objects.select_related('quiz', 'student')
        quiz_id = self.request.query_params.get('quiz')
        if quiz_id:
            queryset = queryset.filter(quiz_id=quiz_id)

        user = self.request.user
        if user.role == 'admin':
            return queryset
        if user.role == 'instructor':
            return queryset.filter(quiz__module__course__instructor=user)
        return queryset.filter(student=user)

    def perform_create(self, serializer):
        quiz = serializer.validated_data['quiz']
        user = self.request.user

        if user.role != 'student':
            raise PermissionDenied("Only students can submit quizzes.")

        # enforce attempt limit
        attempts = QuizSubmission.objects.filter(quiz=quiz, student=user).count()
        if attempts >= quiz.attempts_allowed:
            raise PermissionDenied("You have reached the maximum number of attempts for this quiz.")

        submission = serializer.save(student=user, attempt_number=attempts + 1)

        answers_payload = self.request.data.get('answers', {})

        # Basic auto-grading for multiple choice / true_false questions
        total_points = 0
        earned_points = 0

        for question in quiz.questions.all():
            total_points += question.points
            answer_data = answers_payload.get(str(question.id), {})
            selected_choice_id = answer_data.get('choice')
            text_response = answer_data.get('text', '')

            selected_choice = None
            if selected_choice_id:
                selected_choice = question.choices.filter(id=selected_choice_id).first()

            is_correct = False
            if question.question_type in ['multiple_choice', 'true_false'] and selected_choice:
                is_correct = selected_choice.is_correct
            elif question.question_type == 'short_answer':
                # auto grading stub - always zero, instructor can update
                is_correct = False

            points_awarded = question.points if is_correct else 0
            earned_points += points_awarded

            QuizSubmissionAnswer.objects.create(
                submission=submission,
                question=question,
                selected_choice=selected_choice,
                text_response=text_response,
                is_correct=is_correct,
                points_awarded=points_awarded,
            )

        if total_points > 0:
            submission.score = round((earned_points / total_points) * 100, 2)
            submission.passed = submission.score >= quiz.passing_score
            submission.save(update_fields=['score', 'passed'])

        return submission


class QuestionBankEntryViewSet(viewsets.ModelViewSet):
    serializer_class = QuestionBankEntrySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = QuestionBankEntry.objects.filter(owner=user)
        if user.is_admin:
            queryset = QuestionBankEntry.objects.all()
        course_id = self.request.query_params.get('course')
        search = self.request.query_params.get('search')
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        if search:
            queryset = queryset.filter(prompt__icontains=search)
        return queryset

    def perform_create(self, serializer):
        user = self.request.user
        course = serializer.validated_data.get('course')
        if course and course.instructor != user and not user.is_admin:
            raise PermissionDenied("You do not have permission to save questions for this course.")
        serializer.save(owner=user)

    def perform_update(self, serializer):
        entry = self.get_object()
        user = self.request.user
        if entry.owner != user and not user.is_admin:
            raise PermissionDenied("You do not have permission to edit this question.")
        course = serializer.validated_data.get('course', entry.course)
        if course and course.instructor != user and not user.is_admin:
            raise PermissionDenied("You do not have permission to assign this course.")
        serializer.save()

    def perform_destroy(self, instance):
        user = self.request.user
        if instance.owner != user and not user.is_admin:
            raise PermissionDenied("You do not have permission to delete this question.")
        instance.delete()


class EnrollmentViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = EnrollmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Enrollment.objects.filter(student=self.request.user)


class WishlistViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = WishlistSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Wishlist.objects.filter(student=self.request.user)


class InstructorAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if not (getattr(user, "is_instructor", False) or getattr(user, "is_admin", False)):
            raise PermissionDenied("Only instructors or admins can view instructor analytics.")

        instructor_id = request.query_params.get("instructor_id")
        if user.is_admin and instructor_id:
            try:
                instructor = User.objects.get(id=instructor_id)
            except User.DoesNotExist:
                return Response({"detail": "Instructor not found."}, status=status.HTTP_404_NOT_FOUND)
            courses = Course.objects.filter(instructor=instructor)
        elif user.is_admin:
            courses = Course.objects.all()
        else:
            courses = Course.objects.filter(instructor=user)

        courses = courses.prefetch_related(
            "modules__assignments__submissions",
            "modules__quizzes__submissions",
        )

        summary = {
            "total_courses": courses.count(),
            "total_enrollments": 0,
            "total_revenue": 0.0,
            "average_completion_rate": 0.0,
            "average_quiz_score": 0.0,
        }

        completion_rates = []
        quiz_scores = []
        detailed_courses = []

        for course in courses:
            enrollments = Enrollment.objects.filter(course=course)
            enrollment_count = enrollments.count()
            completed_count = enrollments.filter(progress__gte=100).count()
            avg_progress = enrollments.aggregate(avg=Avg("progress"))["avg"] or 0
            assignment_submissions = AssignmentSubmission.objects.filter(assignment__module__course=course).count()
            quiz_submissions = QuizSubmission.objects.filter(quiz__module__course=course)
            avg_quiz_score = quiz_submissions.aggregate(avg=Avg("score"))["avg"] or 0

            completion_rate = (completed_count / enrollment_count * 100) if enrollment_count else 0
            revenue = float(course.price) * enrollment_count if course.price else 0.0

            summary["total_enrollments"] += enrollment_count
            summary["total_revenue"] += revenue

            completion_rates.append(completion_rate)
            if avg_quiz_score:
                quiz_scores.append(avg_quiz_score)

            detailed_courses.append({
                "id": course.id,
                "title": course.title,
                "status": course.status,
                "enrollments": enrollment_count,
                "completion_rate": round(completion_rate, 2),
                "average_progress": round(avg_progress, 2),
                "average_quiz_score": round(avg_quiz_score or 0, 2),
                "assignment_submissions": assignment_submissions,
                "quiz_submissions": quiz_submissions.count(),
                "revenue": round(revenue, 2),
                "updated_at": course.updated_at,
            })

        if completion_rates:
            summary["average_completion_rate"] = round(sum(completion_rates) / len(completion_rates), 2)
        if quiz_scores:
            summary["average_quiz_score"] = round(sum(quiz_scores) / len(quiz_scores), 2)

        return Response({
            "summary": summary,
            "courses": detailed_courses,
        })


class AdminAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if not getattr(user, "is_admin", False):
            raise PermissionDenied("Only administrators can view platform analytics.")

        total_users = User.objects.count()
        total_students = User.objects.filter(role="student").count()
        total_instructors = User.objects.filter(Q(role="instructor") | Q(role="admin")).count()
        total_courses = Course.objects.count()
        total_enrollments = Enrollment.objects.count()
        total_assignments = AssignmentSubmission.objects.count()
        total_quiz_submissions = QuizSubmission.objects.count()

        revenue = Enrollment.objects.aggregate(
            total=Sum(models.F("course__price"))
        )["total"] or 0

        category_breakdown = Course.objects.values("category").annotate(
            course_count=Count("id"),
            enrollments=Count("enrollments"),
        ).order_by("-enrollments")[:10]

        return Response({
            "summary": {
                "total_users": total_users,
                "total_students": total_students,
                "total_instructors": total_instructors,
                "total_courses": total_courses,
                "total_enrollments": total_enrollments,
                "total_assignment_submissions": total_assignments,
                "total_quiz_submissions": total_quiz_submissions,
                "estimated_revenue": float(revenue),
            },
            "category_breakdown": list(category_breakdown),
        })
