from rest_framework import serializers
from .models import SanitationData

class SanitationDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = SanitationData
        fields = '__all__'