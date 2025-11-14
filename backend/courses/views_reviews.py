from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q, Avg, Count
from .models import Review, Category
from .serializers import ReviewSerializer, CategorySerializer

class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Review.objects.filter(
            Q(student=self.request.user) | Q(course__instructor=self.request.user)
        ).select_related('student', 'course')

    def perform_create(self, serializer):
        serializer.save(student=self.request.user)

class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = []
    
    def get_queryset(self):
        return Category.objects.annotate(
            courses_count=Count('courses'),
            avg_rating=Avg('courses__average_rating')
        ).filter(courses_count__gt=0)