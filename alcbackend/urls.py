from django.contrib import admin
from django.urls import path, include

print("Main URLs are being loaded!")

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('api.urls')),  # This line should already be here or similar
    path('api/', include('api.urls')),
]