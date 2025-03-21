# enrollments/views.py
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.generic import ListView, DetailView
from django.contrib import messages
from django.urls import reverse
from django.utils import timezone
from django.db import models
from django.http import JsonResponse
from django.db.models import Q
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import Enrollment, Progress
from courses.models import Course, Module, Content

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def enroll_course(request, course_id):
    try:
        print(f"Attempting to enroll user {request.user.username} in course {course_id}")
        print(f"Auth header: {request.headers.get('Authorization', 'No Auth header')}")
        
        if not request.user.is_authenticated:
            return Response(
                {'message': 'Authentication required'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Verify course exists
        try:
            course = Course.objects.get(id=course_id)
        except Course.DoesNotExist:
            return Response(
                {'message': f'Course with ID {course_id} not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if already enrolled
        existing_enrollment = Enrollment.objects.filter(
            user=request.user,
            course=course
        ).first()
        
        if existing_enrollment:
            print(f"Found existing enrollment with status: {existing_enrollment.status}")
            if existing_enrollment.status == 'dropped':
                # Reactivate dropped enrollment
                existing_enrollment.status = 'active'
                existing_enrollment.save()
                return Response({
                    'message': 'Successfully re-enrolled in course',
                    'enrollment_id': existing_enrollment.id
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'message': 'You are already enrolled in this course',
                    'enrollment_id': existing_enrollment.id
                }, status=status.HTTP_400_BAD_REQUEST)
        
        print("Creating new enrollment")
        # Create new enrollment
        try:
            enrollment = Enrollment.objects.create(
                user=request.user,
                course=course,
                status='active'
            )
            
            # Create progress records for each section
            for section in course.sections.all():
                Progress.objects.create(
                    enrollment=enrollment,
                    section=section
                )
            
            print(f"Successfully created enrollment with ID: {enrollment.id}")
            return Response({
                'message': 'Successfully enrolled in course',
                'enrollment_id': enrollment.id
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            print(f"Error creating enrollment: {str(e)}")
            return Response({
                'message': f'Error creating enrollment: {str(e)}',
                'details': {
                    'user_id': request.user.id,
                    'course_id': course_id,
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        print(f"Unexpected error in enroll_course: {str(e)}")
        return Response({
            'message': f'An unexpected error occurred: {str(e)}',
            'error_type': type(e).__name__
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_enrollment(request, course_id):
    try:
        print(f"Checking enrollment for user {request.user.username} in course {course_id}")
        print(f"Auth header: {request.headers.get('Authorization', 'No Auth header')}")
        
        if not request.user.is_authenticated:
            return Response(
                {'message': 'Authentication required'},
                status=status.HTTP_401_UNAUTHORIZED
            )
            
        course = get_object_or_404(Course, id=course_id)
        is_enrolled = Enrollment.objects.filter(
            user=request.user,
            course=course,
            status='active'
        ).exists()
        
        return Response({'is_enrolled': is_enrolled})
        
    except Exception as e:
        print(f"Error checking enrollment: {str(e)}")
        return Response(
            {'message': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )

@login_required
def unenroll_course(request, course_slug):
    course = get_object_or_404(Course, slug=course_slug)
    enrollment = get_object_or_404(Enrollment, user=request.user, course=course)
    
    if request.method == 'POST':
        enrollment.status = 'dropped'
        enrollment.save()
        messages.success(request, f"You have successfully unenrolled from {course.title}.")
        return redirect('accounts:dashboard')
    
    return render(request, 'enrollments/confirm_unenroll.html', {'course': course})

@login_required
def mark_content_complete(request, content_id):
    content = get_object_or_404(Content, id=content_id)
    course = content.module.course
    enrollment = get_object_or_404(Enrollment, user=request.user, course=course)
    
    progress, created = enrollment.progress.get_or_create(content=content)
    progress.completed = True
    progress.save()
    
    # Check if all content is completed
    total_content = course.modules.aggregate(total= models.Count('contents'))['total']
    completed_content = enrollment.progress.filter(completed=True).count()
    
    if total_content == completed_content:
        enrollment.status = 'completed'
        enrollment.completion_date = timezone.now()
        enrollment.save()
        messages.success(request, f"Congratulations! You have completed the course {course.title}.")
    
    # Redirect to next content or module
    next_content = None
    contents = list(content.module.contents.all())
    current_index = contents.index(content)
    
    if current_index < len(contents) - 1:
        next_content = contents[current_index + 1]
        return redirect('courses:content_detail', content_id=next_content.id)
    
    # If no next content, go to next module
    modules = list(course.modules.all())
    current_module_index = modules.index(content.module)
    
    if current_module_index < len(modules) - 1:
        next_module = modules[current_module_index + 1]
        return redirect('courses:module_detail', course_slug=course.slug, module_id=next_module.id)
    
    # If no next module, go to course completion page
    return redirect('enrollments:course_completion', course_slug=course.slug)

class EnrolledCoursesListView(LoginRequiredMixin, ListView):
    template_name = 'enrollments/enrolled_courses.html'
    context_object_name = 'enrollments'
    
    def get_queryset(self):
        return Enrollment.objects.filter(
            user=self.request.user,
            status='active'
        ).select_related('course')
    
    def render_to_response(self, context, **response_kwargs):
        if self.request.headers.get('Accept') == 'application/json':
            enrollments = self.get_queryset()
            data = []
            for enrollment in enrollments:
                course = enrollment.course
                data.append({
                    'id': enrollment.id,
                    'course_id': course.id,
                    'title': course.title,
                    'description': course.description,
                    'thumbnail': course.thumbnail.url if course.thumbnail else None,
                    'cover_image': course.cover_image.url if course.cover_image else None,
                    'instructor': course.instructor.username,
                    'category': course.category.name,
                    'difficulty': course.difficulty,
                    'price': str(course.price),
                    'duration_in_weeks': course.duration_in_weeks,
                    'enrolled_at': enrollment.created_at.isoformat(),
                    'status': enrollment.status
                })
            return JsonResponse(data, safe=False)
        return super().render_to_response(context, **response_kwargs)

class CourseProgressView(LoginRequiredMixin, DetailView):
    model = Enrollment
    template_name = 'enrollments/course_progress.html'
    context_object_name = 'enrollment'
    
    def get_object(self):
        course_slug = self.kwargs.get('course_slug')
        course = get_object_or_404(Course, slug=course_slug)
        return get_object_or_404(Enrollment, user=self.request.user, course=course)
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        enrollment = self.get_object()
        course = enrollment.course
        
        context['course'] = course
        context['modules'] = course.modules.all()
        
        # Calculate progress for each module
        module_progress = {}
        for module in course.modules.all():
            total_content = module.contents.count()
            if total_content == 0:
                module_progress[module.id] = 0
                continue
                
            completed_content = enrollment.progress.filter(
                content__module=module,
                completed=True
            ).count()
            
            module_progress[module.id] = (completed_content / total_content) * 100
            
        context['module_progress'] = module_progress
        return context

class CourseCompletionView(LoginRequiredMixin, DetailView):
    model = Course
    template_name = 'enrollments/course_completion.html'
    context_object_name = 'course'
    slug_url_kwarg = 'course_slug'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        course = self.get_object()
        user = self.request.user
        
        enrollment = get_object_or_404(Enrollment, user=user, course=course)
        context['enrollment'] = enrollment
        
        # Suggest related courses
        context['related_courses'] = Course.objects.filter(
            category=course.category,
            is_published=True
        ).exclude(id=course.id)[:3]
        
        return context