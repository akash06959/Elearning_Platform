from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.generic import ListView, DetailView, CreateView, UpdateView, DeleteView
from django.urls import reverse_lazy
from django.contrib import messages
from django.db.models import Q, Avg
from django.conf import settings
from django.db import models
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from .models import Course, Category, Section, Lesson, Review
from .forms import CourseForm, ModuleForm, ContentForm, ReviewForm
from accounts.models import User
from enrollments.models import Enrollment, Progress

class CourseListView(ListView):
    model = Course
    template_name = 'courses/course_list.html'
    context_object_name = 'courses'
    paginate_by = 9
    
    def get_queryset(self):
        queryset = Course.objects.filter(is_published=True)
        category = self.request.GET.get('category')
        search = self.request.GET.get('search')
        difficulty = self.request.GET.get('difficulty')
        
        if category:
            queryset = queryset.filter(category__id=category)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | 
                Q(description__icontains=search)
            )
        if difficulty:
            queryset = queryset.filter(difficulty=difficulty)
            
        return queryset
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['categories'] = Category.objects.all()
        context['selected_category'] = self.request.GET.get('category', '')
        context['search_query'] = self.request.GET.get('search', '')
        context['selected_difficulty'] = self.request.GET.get('difficulty', '')
        return context

    def render_to_response(self, context, **response_kwargs):
        if self.request.headers.get('Accept') == 'application/json' or self.request.path.startswith('/api/'):
            courses = self.get_queryset()
            data = []
            for course in courses:
                data.append({
                    'id': course.id,
                    'title': course.title,
                    'description': course.description,
                    'thumbnail': course.thumbnail.url if course.thumbnail else None,
                    'cover_image': course.cover_image.url if course.cover_image else None,
                    'instructor': course.instructor.username,
                    'category': course.category.name,
                    'difficulty': course.difficulty,
                    'price': str(course.price),
                    'duration_in_weeks': course.duration_in_weeks,
                    'created_at': course.created_at.isoformat(),
                    'updated_at': course.updated_at.isoformat(),
                })
            return JsonResponse(data, safe=False)
        return super().render_to_response(context, **response_kwargs)

class CourseDetailView(DetailView):
    model = Course
    template_name = 'courses/course_detail.html'
    context_object_name = 'course'
    pk_url_kwarg = 'course_id'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        course = self.get_object()
        user = self.request.user
        
        context['sections'] = course.sections.all()
        context['reviews'] = course.reviews.all()
        context['avg_rating'] = course.reviews.aggregate(Avg('rating'))['rating__avg'] or 0
        
        if user.is_authenticated:
            context['is_enrolled'] = Enrollment.objects.filter(
                user=user, course=course).exists()
            context['user_review'] = Review.objects.filter(
                user=user, course=course).first()
        
        return context

    def render_to_response(self, context, **response_kwargs):
        if self.request.headers.get('Accept') == 'application/json' or self.request.path.startswith('/api/'):
            course = self.get_object()
            data = {
                'id': course.id,
                'title': course.title,
                'description': course.description,
                'thumbnail': course.thumbnail.url if course.thumbnail else None,
                'cover_image': course.cover_image.url if course.cover_image else None,
                'instructor': course.instructor.username,
                'category': course.category.name,
                'difficulty': course.difficulty,
                'price': str(course.price),
                'duration_in_weeks': course.duration_in_weeks,
                'created_at': course.created_at.isoformat(),
                'updated_at': course.updated_at.isoformat(),
                'sections': [
                    {
                        'id': section.id,
                        'title': section.title,
                        'description': section.description,
                        'order': section.order,
                        'lessons': [
                            {
                                'id': lesson.id,
                                'title': lesson.title,
                                'description': lesson.description,
                                'order': lesson.order,
                                'content_type': lesson.content_type,
                                'content': lesson.content
                            }
                            for lesson in section.lessons.all()
                        ]
                    }
                    for section in course.sections.all()
                ]
            }
            return JsonResponse(data)
        return super().render_to_response(context, **response_kwargs)

@login_required
def create_review(request, course_id):
    course = get_object_or_404(Course, id=course_id)
    
    # Check if user is enrolled in the course
    if not Enrollment.objects.filter(user=request.user, course=course).exists():
        messages.error(request, "You must be enrolled in this course to leave a review.")
        return redirect('courses:course_detail', course_id=course_id)
    
    # Check if user already reviewed the course
    existing_review = Review.objects.filter(user=request.user, course=course).first()
    
    if request.method == 'POST':
        form = ReviewForm(request.POST, instance=existing_review)
        if form.is_valid():
            review = form.save(commit=False)
            review.user = request.user
            review.course = course
            review.save()
            messages.success(request, "Your review has been submitted successfully.")
            return redirect('courses:course_detail', course_id=course_id)
    else:
        form = ReviewForm(instance=existing_review)
    
    return render(request, 'courses/create_review.html', {
        'form': form,
        'course': course,
        'existing_review': existing_review
    })

class SectionDetailView(LoginRequiredMixin, DetailView):
    model = Section
    template_name = 'courses/section_detail.html'
    context_object_name = 'section'
    pk_url_kwarg = 'section_id'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        section = self.get_object()
        course = section.course
        user = self.request.user
        
        # Check if user is enrolled in the course
        if not Enrollment.objects.filter(user=user, course=course).exists():
            messages.error(self.request, "You must be enrolled in this course to view this section.")
            return redirect('courses:course_detail', course_id=course.id)
        
        context['course'] = course
        context['lessons'] = section.lessons.all()
        context['enrollment'] = Enrollment.objects.get(user=user, course=course)
        
        # Navigation
        sections = list(course.sections.all())
        current_index = sections.index(section)
        
        if current_index > 0:
            context['prev_section'] = sections[current_index - 1]
        if current_index < len(sections) - 1:
            context['next_section'] = sections[current_index + 1]
            
        return context

class LessonDetailView(LoginRequiredMixin, DetailView):
    model = Lesson
    template_name = 'courses/lesson_detail.html'
    context_object_name = 'lesson'
    pk_url_kwarg = 'lesson_id'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        lesson = self.get_object()
        section = lesson.section
        course = section.course
        user = self.request.user
        
        # Check if user is enrolled in the course
        enrollment = get_object_or_404(Enrollment, user=user, course=course)
        
        context['section'] = section
        context['course'] = course
        
        # Mark section as completed
        progress, created = Progress.objects.get_or_create(
            enrollment=enrollment,
            section=section
        )
        
        # Navigation
        lessons = list(section.lessons.all())
        current_index = lessons.index(lesson)
        
        if current_index > 0:
            context['prev_lesson'] = lessons[current_index - 1]
        if current_index < len(lessons) - 1:
            context['next_lesson'] = lessons[current_index + 1]
            
        return context