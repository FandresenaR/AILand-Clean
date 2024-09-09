from django.db import models

# Create your models here.

class SanitationData(models.Model):
    nom_amo = models.CharField(max_length=255)
    region = models.CharField(max_length=255)
    district = models.CharField(max_length=255)
    commune = models.CharField(max_length=255)
    fokontany = models.CharField(max_length=255)
    localite = models.CharField(max_length=255)
    # Add other fields as needed
    
    def __str__(self):
        return f"{self.localite} - {self.commune}"
