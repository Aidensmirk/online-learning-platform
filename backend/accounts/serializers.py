from rest_framework import serializers
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'role', 'display_name', 'bio', 'profile_picture', 'date_joined')
        read_only_fields = ('id', 'date_joined')


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    password2 = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password2', 'role', 'display_name')

    def validate(self, attrs):
        role = attrs.get('role', 'student')
        if role == 'admin':
            raise serializers.ValidationError({
                'role': "You cannot assign yourself the admin role."
            })
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        user = User.objects.create_user(password=password, **validated_data)
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        if not email or not password:
            raise serializers.ValidationError({
                'non_field_errors': ['Must include "email" and "password".']
            })

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError({
                'non_field_errors': ['Invalid credentials.']
            })

        user = authenticate(username=user.username, password=password)
        if not user:
            raise serializers.ValidationError({
                'non_field_errors': ['Invalid credentials.']
            })

        if not user.is_active:
            raise serializers.ValidationError({
                'non_field_errors': ['User account is disabled.']
            })

        attrs['user'] = user
        return attrs

