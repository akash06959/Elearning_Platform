# courses/urls.py
from django.urls import path
from . import views

app_name = 'courses'

urlpatterns = [
    path('', views.CourseListView.as_view(), name='course_list'),
    path('<int:course_id>/', views.CourseDetailView.as_view(), name='course_detail'),
    path('<int:course_id>/review/', views.create_review, name='create_review'),
    path('section/<int:section_id>/', views.SectionDetailView.as_view(), name='section_detail'),
    path('lesson/<int:lesson_id>/', views.LessonDetailView.as_view(), name='lesson_detail'),
]