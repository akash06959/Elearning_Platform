from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.conf import settings
from django.conf.urls.static import static
from . import views

urlpatterns = [
    # Authentication endpoints
    path('api/login/', views.login_view, name='login'),
    path('api/register/', views.register_view, name='register'),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Admin site
    path('admin/', admin.site.urls),
    
    # API endpoints for existing apps
    path('api/users/', include('users.urls')),
    path('api/courses/', include('courses.urls', namespace='api_courses')),
    
    # New application endpoints
    path('accounts/', include('accounts.urls', namespace='web_accounts')),
    path('courses/', include('courses.urls', namespace='web_courses')),
    path('enrollments/', include('enrollments.urls')),
    path('exams/', include('exams.urls')),
    
    # Default redirect
    path('', RedirectView.as_view(url='http://localhost:3000/login', permanent=False)),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)