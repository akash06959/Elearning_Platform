# enrollments/urls.py
from django.urls import path
from . import views

app_name = 'enrollments'

urlpatterns = [
    path('enroll/<int:course_id>/', views.enroll_course, name='enroll_course'),
    path('check/<int:course_id>/', views.check_enrollment, name='check_enrollment'),
    path('enrolled/', views.EnrolledCoursesListView.as_view(), name='enrolled_courses'),
    path('progress/<int:pk>/', views.CourseProgressView.as_view(), name='course_progress'),
    path('unenroll/<slug:course_slug>/', views.unenroll_course, name='unenroll_course'),
    path('completion/<slug:course_slug>/', views.CourseCompletionView.as_view(), name='course_completion'),
    path('mark-complete/<int:content_id>/', views.mark_content_complete, name='mark_content_complete'),
]