from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import render
import os
import json
import pandas as pd
import matplotlib
matplotlib.use('Agg')  # Set the backend to 'Agg' before importing pyplot
import matplotlib.pyplot as plt
import seaborn as sns
import io
import base64
from django.conf import settings
from django.http import HttpResponseServerError
from firebase_admin import db
import firebase_admin
from firebase_admin import credentials, initialize_app

# Add debug print statements
print(f"BASE_DIR: {settings.BASE_DIR}")

# Construct the path to the private directory
private_dir = os.path.join(settings.BASE_DIR, "alcbackend", "private")

# Check if the private directory exists, if not create it
if not os.path.exists(private_dir):
    os.makedirs(private_dir)
    print(f"Created private directory at: {private_dir}")
else:
    print(f"Private directory already exists at: {private_dir}")

# Add this line to specify the correct path to your JSON file
json_path = r"C:\Users\Njato\Documents\Projets\AiLandClean\private\ailandclean-api-firebase-adminsdk-z0apl-0ee0be9939.json"

print(f"Attempting to load Firebase credentials from: {json_path}")
print(f"File exists: {os.path.exists(json_path)}")

# Use environment variable for Firebase credentials
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = json_path

try:
    if not os.path.exists(json_path):
        raise FileNotFoundError(f"The Firebase credentials file does not exist at {json_path}")
    
    with open(json_path, 'r') as f:
        cred_dict = json.load(f)
    
    cred = credentials.Certificate(cred_dict)
    initialize_app(cred, {
        'databaseURL': 'https://ailandclean-api-default-rtdb.europe-west1.firebasedatabase.app'
    })
    print("Firebase initialized successfully")
except Exception as e:
    print(f"An error occurred: {str(e)}")
    # You might want to raise the exception here to prevent the server from starting
    # raise e

# Remove or comment out any view classes that are not used, like ProcessedDataView if it's not defined

class DashboardView(APIView):
    def get(self, request):
        try:
            # Read data from Firebase
            ref = db.reference('/')  # adjust this path as needed
            data = ref.get()
            
            print(f"Data type: {type(data)}")
            print(f"Data content: {data[:1000] if isinstance(data, str) else data}")  # Print first 1000 characters if it's a string
            
            if data is None:
                return Response({"error": "No data retrieved from Firebase"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            if isinstance(data, str):
                # Try to parse the string as JSON
                try:
                    data = json.loads(data)
                    print("Successfully parsed string data as JSON")
                except json.JSONDecodeError:
                    return Response({"error": "Data is a string but not valid JSON"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            if not isinstance(data, (list, dict)):
                return Response({"error": f"Expected a list or dict, but got {type(data)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            # If data is a dict, try to extract a list from it
            if isinstance(data, dict):
                # Assume the data is in the first key of the dict
                first_key = next(iter(data))
                data = data[first_key]
                print(f"Extracted data from key: {first_key}")
            
            if not isinstance(data, list):
                return Response({"error": f"Unable to extract a list from the data"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            if len(data) == 0:
                return Response({"error": "Data list is empty"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            # Create DataFrame
            df = pd.DataFrame(data)
            
            # Print column names
            print(f"DataFrame columns: {df.columns}")
            
            # Rename columns for easier handling
            df = df.rename(columns={
                'Region': 'region',
                'District': 'district',
                'Commune': 'commune',
                'Fokontany': 'fokontany',
                'Localité (village)': 'village',
                '# ménage du village': 'households',
                '# population totale': 'population',
                '# latrines flyproof non partagées (par menage)': 'latrines_per_household'
            })
            
            # Convert relevant columns to numeric
            numeric_columns = ['households', 'population', 'latrines_per_household']
            for col in numeric_columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')
            
            # Calculate latrine rate
            df['latrine_rate'] = df['latrines_per_household'] / df['households']
            
            # Remove rows with NaN latrine_rate
            df = df.dropna(subset=['latrine_rate'])
            
            if df.empty:
                return Response({"error": "No valid data after processing"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            # Basic statistics
            stats = {
                'total_records': len(df),
                'avg_latrine_rate': df['latrine_rate'].mean(),
                'regions': df['region'].nunique(),
                'highest_latrine_rate': df['latrine_rate'].max(),
                'lowest_latrine_rate': df['latrine_rate'].min(),
                'median_latrine_rate': df['latrine_rate'].median(),
            }
            
            return Response(stats, status=status.HTTP_200_OK)
        
        except Exception as e:
            print(f"An error occurred: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Define other view classes here if they are used in urls.py
# For example:
# class PriorityAreasView(APIView):
#     ...

# class HomeAPIView(APIView):
#     ...

# class SomeEndpointView(APIView):
#     ...

# class AIFilteredSanitationDataView(APIView):
#     ...

def home(request):
    # Define your home view function here
    return HttpResponseServerError("Firebase initialization failed. Check server logs for details.")

def get_sanitation_data(request):
    # Define your get_sanitation_data function here
    pass