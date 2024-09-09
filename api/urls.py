from django.urls import path
from .views import DashboardView

print("API URLs are being loaded!")

urlpatterns = [
    path('', DashboardView.as_view(), name='dashboard'),
    # Remove or comment out other URL patterns that are not needed
]