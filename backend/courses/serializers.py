from rest_framework import serializers
from .models import Category, Course, Section, Lesson
from enrollments.models import Enrollment, Progress

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description']

class LessonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lesson
        fields = ['id', 'title', 'content_type', 'video_url', 'pdf_file', 'content', 'order']

class SectionSerializer(serializers.ModelSerializer):
    lessons = LessonSerializer(many=True, read_only=True)
    
    class Meta:
        model = Section
        fields = ['id', 'title', 'order', 'lessons']

class CourseDetailSerializer(serializers.ModelSerializer):
    sections = SectionSerializer(many=True, read_only=True)
    category = CategorySerializer(read_only=True)
    
    class Meta:
        model = Course
        fields = ['id', 'title', 'description', 'price', 'instructor', 
                  'thumbnail', 'category', 'sections', 'created_at', 'updated_at']

class CourseListSerializer(serializers.ModelSerializer):
    category = serializers.StringRelatedField()
    
    class Meta:
        model = Course
        fields = ['id', 'title', 'description', 'price', 'instructor', 'thumbnail', 'category', 'created_at']

class EnrollmentSerializer(serializers.ModelSerializer):
    course = CourseListSerializer(read_only=True)
    
    class Meta:
        model = Enrollment
        fields = ['id', 'course', 'status', 'created_at', 'completion_date']
        read_only_fields = ['user']

class ProgressSerializer(serializers.ModelSerializer):
    section_title = serializers.CharField(source='section.title', read_only=True)
    
    class Meta:
        model = Progress
        fields = ['id', 'section', 'section_title', 'completed', 'completed_at']