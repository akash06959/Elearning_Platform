# exams/urls.py
from django.urls import path
from . import views

app_name = 'exams'

urlpatterns = [
    path('upcoming/', views.UpcomingExamsListView.as_view(), name='upcoming_exams'),
    path('history/', views.StudentExamHistoryView.as_view(), name='student_exam_history'),
    path('<int:exam_id>/', views.ExamDetailView.as_view(), name='exam_detail'),
    path('<int:exam_id>/start/', views.start_exam, name='start_exam'),
    path('attempt/<int:attempt_id>/', views.take_exam, name='take_exam'),
    path('attempt/<int:attempt_id>/submit/', views.submit_exam, name='submit_exam'),
    path('attempt/<int:attempt_id>/results/', views.exam_results, name='exam_results'),
    path('instructor/exams/', views.InstructorExamListView.as_view(), name='instructor_exams'),
    path('instructor/exam/<int:exam_id>/attempts/', views.instructor_exam_attempts, name='instructor_exam_attempts'),
    path('instructor/attempt/<int:attempt_id>/grade/', views.grade_exam, name='grade_exam'),
]