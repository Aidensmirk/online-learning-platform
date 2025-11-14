from rest_framework import serializers
from .models import (
    Course,
    CourseModule,
    Lesson,
    Assignment,
    AssignmentSubmission,
    Quiz,
    QuizQuestion,
    QuizChoice,
    QuestionBankEntry,
    QuizSubmission,
    QuizSubmissionAnswer,
    LessonProgress,
    Enrollment,
    Wishlist,
)
from accounts.serializers import UserSerializer


class QuizChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizChoice
        fields = ('id', 'text', 'is_correct')
        extra_kwargs = {'is_correct': {'write_only': True}}


class QuizQuestionSerializer(serializers.ModelSerializer):
    choices = QuizChoiceSerializer(many=True, required=False)

    class Meta:
        model = QuizQuestion
        fields = ('id', 'prompt', 'question_type', 'order', 'points', 'choices')

    def create(self, validated_data):
        choices_data = validated_data.pop('choices', [])
        question = QuizQuestion.objects.create(**validated_data)
        for choice_data in choices_data:
            QuizChoice.objects.create(question=question, **choice_data)
        return question

    def update(self, instance, validated_data):
        choices_data = validated_data.pop('choices', [])
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if choices_data:
            instance.choices.all().delete()
            for choice_data in choices_data:
                QuizChoice.objects.create(question=instance, **choice_data)
        return instance


class QuizSerializer(serializers.ModelSerializer):
    questions = QuizQuestionSerializer(many=True, required=False)

    class Meta:
        model = Quiz
        fields = (
            'id',
            'module',
            'title',
            'description',
            'time_limit_minutes',
            'attempts_allowed',
            'passing_score',
            'created_at',
            'questions',
        )
        read_only_fields = ('created_at',)

    def create(self, validated_data):
        questions_data = validated_data.pop('questions', [])
        quiz = Quiz.objects.create(**validated_data)
        for question_data in questions_data:
            choices_data = question_data.pop('choices', [])
            question = QuizQuestion.objects.create(quiz=quiz, **question_data)
            for choice_data in choices_data:
                QuizChoice.objects.create(question=question, **choice_data)
        return quiz

    def update(self, instance, validated_data):
        questions_data = validated_data.pop('questions', [])
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if questions_data:
            instance.questions.all().delete()
            for question_data in questions_data:
                choices_data = question_data.pop('choices', [])
                question = QuizQuestion.objects.create(quiz=instance, **question_data)
                for choice_data in choices_data:
                    QuizChoice.objects.create(question=question, **choice_data)
        return instance


class QuestionBankEntrySerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    choices = serializers.JSONField(required=False)

    class Meta:
        model = QuestionBankEntry
        fields = (
            'id',
            'owner',
            'course',
            'title',
            'prompt',
            'question_type',
            'points',
            'choices',
            'tags',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('owner', 'created_at', 'updated_at')

    def validate(self, attrs):
        question_type = attrs.get('question_type', self.instance.question_type if self.instance else None)
        choices = attrs.get('choices', self.instance.choices if self.instance else [])
        if question_type in ('multiple_choice', 'true_false') and not choices:
            raise serializers.ValidationError("Choices are required for selectable question types.")
        return attrs


class LessonSerializer(serializers.ModelSerializer):
    is_completed = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = (
            'id',
            'module',
            'title',
            'overview',
            'content',
            'video_url',
            'resource_link',
            'order',
            'duration_minutes',
            'is_published',
            'created_at',
            'is_completed',
        )
        read_only_fields = ('created_at',)

    def get_is_completed(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated and request.user.role == 'student':
            return obj.progress_records.filter(enrollment__student=request.user).exists()
        return False


class AssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assignment
        fields = (
            'id',
            'module',
            'title',
            'instructions',
            'attachment',
            'due_date',
            'max_points',
            'allow_resubmission',
            'created_at',
        )
        read_only_fields = ('created_at',)


class AssignmentSubmissionBriefSerializer(serializers.ModelSerializer):
    student = UserSerializer(read_only=True)
    reviewed_by = UserSerializer(read_only=True)

    class Meta:
        model = AssignmentSubmission
        fields = (
            'id',
            'student',
            'submitted_at',
            'attachment',
            'text_response',
            'grade',
            'feedback',
            'status',
            'reviewed_at',
            'reviewed_by',
            'is_late',
        )


class AssignmentDetailSerializer(AssignmentSerializer):
    submissions = AssignmentSubmissionBriefSerializer(many=True, read_only=True)

    class Meta(AssignmentSerializer.Meta):
        fields = AssignmentSerializer.Meta.fields + ('submissions',)


class CourseModuleSerializer(serializers.ModelSerializer):
    lessons = LessonSerializer(many=True, read_only=True)
    assignments = AssignmentSerializer(many=True, read_only=True)
    quizzes = QuizSerializer(many=True, read_only=True)

    class Meta:
        model = CourseModule
        fields = (
            'id',
            'course',
            'title',
            'description',
            'order',
            'release_date',
            'lessons',
            'assignments',
            'quizzes',
        )


class CourseSerializer(serializers.ModelSerializer):
    instructor = UserSerializer(read_only=True)
    instructor_id = serializers.IntegerField(write_only=True, required=False)
    modules = CourseModuleSerializer(many=True, read_only=True)
    is_enrolled = serializers.SerializerMethodField()
    is_in_wishlist = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')

    def get_is_enrolled(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Enrollment.objects.filter(student=request.user, course=obj).exists()
        return False

    def get_is_in_wishlist(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Wishlist.objects.filter(student=request.user, course=obj).exists()
        return False


class AssignmentSubmissionSerializer(serializers.ModelSerializer):
    student = UserSerializer(read_only=True)
    assignment = AssignmentSerializer(read_only=True)
    assignment_id = serializers.PrimaryKeyRelatedField(
        queryset=Assignment.objects.all(), write_only=True, source='assignment', required=False
    )
    reviewed_by = UserSerializer(read_only=True)

    class Meta:
        model = AssignmentSubmission
        fields = (
            'id',
            'assignment',
            'assignment_id',
            'student',
            'submitted_at',
            'attachment',
            'text_response',
            'grade',
            'feedback',
            'status',
            'reviewed_at',
            'reviewed_by',
            'is_late',
        )
        read_only_fields = ('submitted_at', 'reviewed_at', 'reviewed_by', 'is_late')


class LessonProgressSerializer(serializers.ModelSerializer):
    lesson = LessonSerializer(read_only=True)

    class Meta:
        model = LessonProgress
        fields = ('id', 'lesson', 'completed_at')


class QuizSubmissionAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizSubmissionAnswer
        fields = (
            'id',
            'question',
            'selected_choice',
            'text_response',
            'is_correct',
            'points_awarded',
        )
        read_only_fields = ('is_correct', 'points_awarded')


class QuizSubmissionSerializer(serializers.ModelSerializer):
    student = UserSerializer(read_only=True)
    answers = QuizSubmissionAnswerSerializer(many=True, read_only=True)
    quiz = QuizSerializer(read_only=True)

    class Meta:
        model = QuizSubmission
        fields = (
            'id',
            'quiz',
            'student',
            'submitted_at',
            'attempt_number',
            'score',
            'passed',
            'answers',
        )
        read_only_fields = ('submitted_at', 'score', 'passed', 'attempt_number')

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        if request and request.user == instance.student:
            data['answers'] = QuizSubmissionAnswerSerializer(instance.answers.all(), many=True).data
        return data


class EnrollmentSerializer(serializers.ModelSerializer):
    student = UserSerializer(read_only=True)
    course = CourseSerializer(read_only=True)
    lesson_progress = LessonProgressSerializer(many=True, read_only=True)

    class Meta:
        model = Enrollment
        fields = '__all__'
        read_only_fields = ('enrolled_at',)


class WishlistSerializer(serializers.ModelSerializer):
    student = UserSerializer(read_only=True)
    course = CourseSerializer(read_only=True)

    class Meta:
        model = Wishlist
        fields = '__all__'
        read_only_fields = ('added_at',)

