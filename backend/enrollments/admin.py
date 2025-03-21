from django.contrib import admin
from .models import Enrollment, Progress

@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ('user', 'course', 'status', 'created_at', 'completion_date')
    list_filter = ('status', 'created_at', 'completion_date')
    search_fields = ('user__username', 'course__title')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('-created_at',)

@admin.register(Progress)
class ProgressAdmin(admin.ModelAdmin):
    list_display = ('enrollment', 'section', 'completed', 'completed_at')
    list_filter = ('completed', 'completed_at')
    search_fields = ('enrollment__user__username', 'section__title')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('-created_at',)
