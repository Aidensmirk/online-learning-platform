from django.contrib.auth.models import AbstractUser, UserManager as DjangoUserManager
from django.db import models


class UserManager(DjangoUserManager):
    """Custom user manager that ensures role-based flags are set correctly."""

    use_in_migrations = True

    def _create_user(self, username, email, password, **extra_fields):
        if not username:
            raise ValueError("The given username must be set")
        email = self.normalize_email(email)
        role = extra_fields.get("role", "student")

        if role == "admin":
            extra_fields.setdefault("is_staff", True)
            extra_fields.setdefault("is_superuser", True)

        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, username, email=None, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        extra_fields.setdefault("role", extra_fields.get("role", "student"))

        # Ensure admin role can't be created through create_user
        if extra_fields["role"] == "admin":
            extra_fields["is_staff"] = True
            extra_fields["is_superuser"] = True

        return super().create_user(username, email=email, password=password, **extra_fields)

    def create_superuser(self, username, email=None, password=None, **extra_fields):
        extra_fields.setdefault("role", "admin")
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)

        if extra_fields["role"] != "admin":
            raise ValueError("Superuser must have role='admin'.")

        return super().create_superuser(username, email=email, password=password, **extra_fields)


class User(AbstractUser):
    ROLE_CHOICES = [
        ("student", "Student"),
        ("instructor", "Instructor"),
        ("admin", "Admin"),
    ]

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="student")
    display_name = models.CharField(max_length=255, blank=True)
    bio = models.TextField(blank=True)
    profile_picture = models.ImageField(upload_to="profile_pictures/", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    @property
    def is_admin(self):
        return self.role == "admin"

    @property
    def is_instructor(self):
        return self.role == "instructor"

    def save(self, *args, **kwargs):
        # Ensure admin role always has appropriate flags
        if self.role == "admin":
            self.is_staff = True
            self.is_superuser = True
        super().save(*args, **kwargs)

    def __str__(self):
        return self.username

