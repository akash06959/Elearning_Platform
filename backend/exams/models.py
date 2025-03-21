# exams/models.py
from django.db import models
from accounts.models import User
from courses.models import Course, Module

class Exam(models.Model):
    """Model for course exams"""
    EXAM_TYPE_CHOICES = (
        ('quiz', 'Quiz'),
        ('midterm', 'Midterm'),
        ('final', 'Final'),
        ('assignment', 'Assignment'),
    )
    
    title = models.CharField(max_length=255)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='exams')
    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name='exams', null=True, blank=True)
    exam_type = models.CharField(max_length=20, choices=EXAM_TYPE_CHOICES)
    description = models.TextField(blank=True)
    instructions = models.TextField(blank=True)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    duration_minutes = models.PositiveIntegerField(default=60)
    passing_score = models.PositiveIntegerField(default=60)  # Percentage
    max_attempts = models.PositiveIntegerField(default=1)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.course.title} - {self.title}"
    
    @property
    def is_upcoming(self):
        from django.utils import timezone
        return self.start_date > timezone.now()
    
    @property
    def is_ongoing(self):
        from django.utils import timezone
        now = timezone.now()
        return self.start_date <= now <= self.end_date

class Question(models.Model):
    """Exam questions"""
    QUESTION_TYPE_CHOICES = (
        ('multiple_choice', 'Multiple Choice'),
        ('true_false', 'True/False'),
        ('short_answer', 'Short Answer'),
        ('essay', 'Essay'),
    )
    
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='questions')
    question_text = models.TextField()
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPE_CHOICES)
    points = models.PositiveIntegerField(default=1)
    order = models.PositiveIntegerField(default=0)
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return f"{self.exam.title} - Q{self.order}"

class Choice(models.Model):
    """Choices for multiple choice questions"""
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='choices')
    choice_text = models.CharField(max_length=255)
    is_correct = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.question} - {self.choice_text}"

class ExamAttempt(models.Model):
    """Record of a user's attempt at an exam"""
    STATUS_CHOICES = (
        ('in_progress', 'In Progress'),
        ('submitted', 'Submitted'),
        ('graded', 'Graded'),
    )
    
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='attempts')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='exam_attempts')
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)
    score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='in_progress')
    feedback = models.TextField(blank=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.exam.title}"
    
    @property
    def is_passed(self):
        if self.score is None:
            return False
        return self.score >= self.exam.passing_score

class Answer(models.Model):
    """User's answers for exam questions"""
    attempt = models.ForeignKey(ExamAttempt, on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='answers')
    selected_choice = models.ForeignKey(Choice, on_delete=models.CASCADE, related_name='selections', null=True, blank=True)
    text_answer = models.TextField(blank=True)
    is_correct = models.BooleanField(null=True, blank=True)
    points_earned = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    feedback = models.TextField(blank=True)
    
    class Meta:
        unique_together = ('attempt', 'question')
    
    def __str__(self):
        return f"{self.attempt.user.username} - {self.question}"