from django.contrib import admin
from .models import Category, Course, Section, Lesson, Progress

class LessonInline(admin.TabularInline):
    model = Lesson
    extra = 1

class SectionInline(admin.TabularInline):
    model = Section
    extra = 1
    inlines = [LessonInline]

@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('title', 'instructor', 'price', 'category', 'created_at')
    list_filter = ('category', 'created_at')
    search_fields = ('title', 'description', 'instructor')
    inlines = [SectionInline]

@admin.register(Section)
class SectionAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'order')
    list_filter = ('course',)
    search_fields = ('title', 'course__title')
    inlines = [LessonInline]

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name', 'description')

@admin.register(Progress)
class ProgressAdmin(admin.ModelAdmin):
    list_display = ('user', 'lesson', 'completed_at')
    list_filter = ('completed_at',)
    search_fields = ('user__username', 'lesson__title')