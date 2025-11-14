from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.models import User
from courses.models import Enrollment
from .models import Conversation, ConversationParticipant, Message, MessageRead
from .serializers import (
    ConversationSerializer,
    ConversationParticipantSerializer,
    MessageSerializer,
    MessageReadSerializer,
)


class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            return Conversation.objects.all()
        return Conversation.objects.filter(participants__user=user).distinct()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user
        course = serializer.validated_data.get("course")

        # Explicit participant IDs submitted with the request (optional)
        requested_participant_users = serializer.validated_data.get("participant_ids", [])
        participant_ids = {user.id for user in requested_participant_users if user}

        if course:
            if user.role == "student" and not Enrollment.objects.filter(course=course, student=user).exists():
                raise PermissionDenied("You must be enrolled in this course to start a conversation.")
            if user.role == "instructor" and course.instructor != user:
                raise PermissionDenied("You must be the instructor for this course.")

        conversation = serializer.save(created_by=user)

        # Ensure creator is a participant
        ConversationParticipant.objects.get_or_create(conversation=conversation, user=user)

        # Auto-include course-related participants
        auto_participant_ids = set(participant_ids)

        if course:
            if user.role == "student":
                if course.instructor:
                    auto_participant_ids.add(course.instructor_id)
            elif user.role == "instructor":
                include_students = str(request.data.get("include_course_students", "")).lower() in {"1", "true", "yes"}
                if include_students:
                    student_ids = Enrollment.objects.filter(course=course).values_list("student_id", flat=True)
                    auto_participant_ids.update(student_ids)
            elif user.role == "admin":
                include_students = str(request.data.get("include_course_students", "")).lower() in {"1", "true", "yes"}
                if include_students:
                    student_ids = Enrollment.objects.filter(course=course).values_list("student_id", flat=True)
                    auto_participant_ids.update(student_ids)
                if course.instructor:
                    auto_participant_ids.add(course.instructor_id)

        # Filter out creator and duplicate users
        unique_participant_ids = [pid for pid in auto_participant_ids if pid and pid != user.id]
        if unique_participant_ids:
            for participant in User.objects.filter(id__in=unique_participant_ids):
                ConversationParticipant.objects.get_or_create(conversation=conversation, user=participant)

        headers = self.get_success_headers(serializer.data)
        output_serializer = self.get_serializer(conversation)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def add_participant(self, request, pk=None):
        conversation = self.get_object()
        user = request.user
        if not (user.is_admin or conversation.created_by == user):
            raise PermissionDenied("You do not have permission to add participants.")
        participant_id = request.data.get("user_id")
        if not participant_id:
            return Response({"detail": "user_id is required."}, status=status.HTTP_400_BAD_REQUEST)
        participant, created = ConversationParticipant.objects.get_or_create(
            conversation=conversation,
            user_id=participant_id,
        )
        serializer = ConversationParticipantSerializer(participant, context={"request": request})
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def remove_participant(self, request, pk=None):
        conversation = self.get_object()
        user = request.user
        if not (user.is_admin or conversation.created_by == user):
            raise PermissionDenied("You do not have permission to remove participants.")
        participant_id = request.data.get("user_id")
        if not participant_id:
            return Response({"detail": "user_id is required."}, status=status.HTTP_400_BAD_REQUEST)
        ConversationParticipant.objects.filter(conversation=conversation, user_id=participant_id).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        conversation_id = self.request.query_params.get("conversation")
        user = self.request.user
        queryset = Message.objects.select_related("conversation", "sender").all()
        if conversation_id:
            queryset = queryset.filter(conversation_id=conversation_id)
        if user.is_admin:
            return queryset
        return queryset.filter(conversation__participants__user=user).distinct()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    def perform_create(self, serializer):
        user = self.request.user
        conversation = serializer.validated_data["conversation"]
        if not ConversationParticipant.objects.filter(conversation=conversation, user=user).exists():
            raise PermissionDenied("You are not a participant in this conversation.")
        message = serializer.save(sender=user)
        MessageRead.objects.get_or_create(message=message, user=user)
        ConversationParticipant.objects.filter(conversation=conversation, user=user).update(last_read_at=timezone.now())
        conversation.updated_at = timezone.now()
        conversation.save(update_fields=["updated_at"])

    def perform_update(self, serializer):
        instance = self.get_object()
        user = self.request.user
        if instance.sender != user and not user.is_admin:
            raise PermissionDenied("You cannot edit this message.")
        serializer.save()

    def perform_destroy(self, instance):
        user = self.request.user
        if instance.sender != user and not user.is_admin:
            raise PermissionDenied("You cannot delete this message.")
        instance.delete()

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def mark_read(self, request, pk=None):
        message = self.get_object()
        user = request.user
        if not ConversationParticipant.objects.filter(conversation=message.conversation, user=user).exists():
            raise PermissionDenied("You are not a participant in this conversation.")
        read_entry, created = MessageRead.objects.get_or_create(message=message, user=user)
        ConversationParticipant.objects.filter(conversation=message.conversation, user=user).update(
            last_read_at=timezone.now()
        )
        serializer = MessageReadSerializer(read_entry, context={"request": request})
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

