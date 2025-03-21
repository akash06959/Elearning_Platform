# enrollments/models.py
from django.db import models
from django.conf import settings
from accounts.models import User
from courses.models import Course, Section, Content

class Enrollment(models.Model):
    """User enrollments in courses"""
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('dropped', 'Dropped'),
    )
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='user_enrollments')
    user_name = models.CharField(max_length=150, null=True)  # Store username at time of enrollment
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='course_enrollments')
    course_name = models.CharField(max_length=200, null=True)  # Store course title at time of enrollment
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completion_date = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ['user', 'course']
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user_name or self.user.username} - {self.course_name or self.course.title}"
    
    def save(self, *args, **kwargs):
        # Store the current username and course title
        if not self.pk or not self.user_name:  # On creation or if name not set
            self.user_name = self.user.username
        if not self.pk or not self.course_name:  # On creation or if name not set
            self.course_name = self.course.title
        super().save(*args, **kwargs)
    
    @property
    def progress_percentage(self):
        """Calculate progress percentage based on completed sections"""
        total_sections = self.course.sections.count()
        if not total_sections:
            return 0
        completed = self.progress.filter(completed=True).count()
        return (completed / total_sections) * 100

class Progress(models.Model):
    """Tracks progress of a user through course content"""
    enrollment = models.ForeignKey(Enrollment, on_delete=models.CASCADE, related_name='progress')
    section = models.ForeignKey('courses.Section', on_delete=models.CASCADE)
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['enrollment', 'section']
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.enrollment.user.username} - {self.section.title}"

class EnrollmentRecord(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='enrollments_record')
    course = models.ForeignKey('courses.Course', on_delete=models.CASCADE, related_name='enrollments_record')
    # Other fields...
