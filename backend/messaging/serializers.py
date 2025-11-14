from rest_framework import serializers

from accounts.models import User
from accounts.serializers import UserSerializer
from courses.models import Course
from .models import Conversation, ConversationParticipant, Message, MessageRead


class CourseSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ("id", "title", "thumbnail")


class ConversationParticipantSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        write_only=True,
        queryset=User.objects.all(),
        source="user",
    )

    class Meta:
        model = ConversationParticipant
        fields = ("id", "user", "user_id", "joined_at", "last_read_at")
        read_only_fields = ("joined_at", "last_read_at", "user")


class MessageReadSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source="user",
        write_only=True,
    )

    class Meta:
        model = MessageRead
        fields = ("id", "user", "user_id", "read_at")
        read_only_fields = ("read_at", "user")


class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    sender_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source="sender",
        write_only=True,
        required=False,
    )
    reads = MessageReadSerializer(many=True, read_only=True)
    is_read = serializers.SerializerMethodField()
    attachment_url = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = (
            "id",
            "conversation",
            "sender",
            "sender_id",
            "body",
            "attachment",
            "attachment_url",
            "created_at",
            "updated_at",
            "is_edited",
            "reads",
            "is_read",
        )
        read_only_fields = ("created_at", "updated_at", "is_edited", "reads", "sender", "is_read", "attachment_url")

    def get_is_read(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return obj.reads.filter(user=request.user).exists()

    def get_attachment_url(self, obj):
        if obj.attachment:
            request = self.context.get("request")
            url = obj.attachment.url
            if request:
                return request.build_absolute_uri(url)
            return url
        return None

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.is_edited = True
        instance.save()
        return instance


class ConversationSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    course = CourseSummarySerializer(read_only=True)
    course_id = serializers.PrimaryKeyRelatedField(
        queryset=Course.objects.all(),
        source="course",
        write_only=True,
        required=False,
    )
    participants = ConversationParticipantSerializer(many=True, read_only=True)
    participant_ids = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        many=True,
        write_only=True,
        required=False,
    )
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = (
            "id",
            "title",
            "course",
            "course_id",
            "created_by",
            "created_at",
            "updated_at",
            "participants",
            "participant_ids",
            "last_message",
            "unread_count",
        )
        read_only_fields = ("created_at", "updated_at", "participants", "created_by", "last_message", "unread_count")

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._participant_users = []

    def create(self, validated_data):
        participant_users = validated_data.pop("participant_ids", [])
        conversation = Conversation.objects.create(**validated_data)
        self._participant_users = participant_users
        return conversation

    def get_last_message(self, obj):
        message = obj.messages.select_related("sender").order_by("-created_at").first()
        if not message:
            return None
        return MessageSerializer(message, context=self.context).data

    def get_unread_count(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return 0
        return obj.messages.exclude(reads__user=request.user).count()

    @property
    def participant_users(self):
        return getattr(self, "_participant_users", [])

