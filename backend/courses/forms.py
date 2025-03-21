# courses/forms.py
from django import forms
from .models import Course, Module, Content, Review

class CourseForm(forms.ModelForm):
    class Meta:
        model = Course
        fields = ['title', 'description', 'category', 'cover_image', 'price', 
                  'difficulty', 'duration_in_weeks', 'is_published']
        widgets = {
            'description': forms.Textarea(attrs={'rows': 4}),
        }

class ModuleForm(forms.ModelForm):
    class Meta:
        model = Module
        fields = ['title', 'description', 'order']
        widgets = {
            'description': forms.Textarea(attrs={'rows': 4}),
        }

class ContentForm(forms.ModelForm):
    class Meta:
        model = Content
        fields = ['title', 'content_type', 'text_content', 'video_url', 'file_content', 'order']
        widgets = {
            'text_content': forms.Textarea(attrs={'rows': 4}),
        }
    
    def clean(self):
        cleaned_data = super().clean()
        content_type = cleaned_data.get('content_type')
        
        # Validate based on content type
        if content_type == 'video' and not cleaned_data.get('video_url'):
            self.add_error('video_url', 'Video URL is required for video content')
        elif content_type == 'text' and not cleaned_data.get('text_content'):
            self.add_error('text_content', 'Text content is required for text content')
        elif content_type == 'resource' and not cleaned_data.get('file_content'):
            self.add_error('file_content', 'File is required for resource content')
        
        return cleaned_data

class ReviewForm(forms.ModelForm):
    class Meta:
        model = Review
        fields = ['rating', 'comment']
        widgets = {
            'comment': forms.Textarea(attrs={'rows': 4}),
            'rating': forms.NumberInput(attrs={'min': 1, 'max': 5}),
        }