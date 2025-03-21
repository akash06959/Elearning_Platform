from django.contrib.auth import authenticate
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json

@csrf_exempt
def login_view(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        username = data.get('username')
        password = data.get('password')
        
        user = authenticate(username=username, password=password)
        
        if user is not None:
            # Authentication successful
            return JsonResponse({
                'success': True,
                'token': 'sample-token',  # Replace with actual token generation
                'message': 'Login successful'
            })
        else:
            # Authentication failed
            return JsonResponse({
                'success': False,
                'message': 'Invalid credentials'
            }, status=401)
    
    # Method not allowed
    return JsonResponse({'error': 'Method not allowed'}, status=405)

# views.py
from django.contrib.auth import get_user_model
User = get_user_model()
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json

from django.http import JsonResponse
from django.contrib.auth import get_user_model
from django.views.decorators.csrf import csrf_exempt
import json

User = get_user_model()  # This gets the proper User model as configured in settings.py

@csrf_exempt
def register_view(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            username = data.get('username')
            email = data.get('email')
            password = data.get('password')
            
            # Validate input data
            if not username or not email or not password:
                return JsonResponse({
                    'success': False,
                    'message': 'Please provide all required fields'
                }, status=400)
            
            # Check if username already exists
            if User.objects.filter(username=username).exists():
                return JsonResponse({
                    'success': False,
                    'message': 'Username already exists'
                }, status=400)
            
            # Check if email already exists
            if User.objects.filter(email=email).exists():
                return JsonResponse({
                    'success': False,
                    'message': 'Email address already in use'
                }, status=400)
            
            # Create new user
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password
            )
            
            return JsonResponse({
                'success': True,
                'message': 'User registered successfully',
                'user_id': user.id
            })
            
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': str(e)
            }, status=500)
    
    return JsonResponse({
        'success': False,
        'message': 'Method not allowed'
    }, status=405)