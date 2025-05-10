"""
Water allocation module - handles water prediction and allocation calculations
"""
from flask import Blueprint, jsonify, request
import pandas as pd
import joblib
from datetime import datetime
import os
import numpy as np

# Create Blueprint for allocation module
allocation_bp = Blueprint('allocation', __name__, url_prefix='/allocation')

# Try multiple possible model paths
model_paths = [
    'allocation/water_optimization_model.pkl',  # Relative to app root
    'Backend/allocation/water_optimization_model.pkl',  # From project root
    os.path.join(os.path.dirname(os.path.abspath(__file__)), 'water_optimization_model.pkl'),  # Absolute path
    'C:\\coding\\WaterWallet\\Backend\\allocation\\water_optimization_model.pkl'  # Original path
]

# Load the model
pipeline = None
for model_path in model_paths:
    try:
        if os.path.exists(model_path):
            pipeline = joblib.load(model_path)
            print(f"Water optimization model loaded successfully from {model_path}")
            break
    except Exception as e:
        print(f"Error loading model from {model_path}: {e}")

if pipeline is None:
    print("WARNING: Failed to load water optimization model. Using fallback prediction logic.")

# Test input data simulating cloud data
test_input = {
    "temperature_C": 30,
    "humidity_%": 60,
    "rain_recent_mm": 5,
    "state": "Karnataka",
    "season": "Summer",
    "climate": "Tropical",
    "hour": 14,
    "day_of_week": 2,
    "valve_state": 1,
    "rainwater_harvested_L": 100,
    # Required consumption columns that were missing
    "kitchen_consumption_L": 0,
    "bathroom_consumption_L": 0,
    "garden_consumption_L": 0,
    "other_consumption_L": 0,
    "total_consumption_L": 0,
    # any other numeric features set to 0
    "water_pressure": 0,
    "population_density": 0
}

# Water allocation weights by zone
ZONE_ALLOCATION = {
    "kitchen": 0.35,
    "bathroom": 0.40,
    "garden": 0.15,
    "outdoor": 0.10  # Rename from 'other_L' to 'outdoor' as per your requirement
}

# Amount of rainwater harvested (L) when harvesting is active
RAINWATER_HARVESTED_L = 100.0


def prepare_input_data(data=None):
    """
    Prepare input data for prediction, using test_input as fallback
    """
    if data is None:
        data = test_input.copy()
    
    # Ensure we have all required features
    input_data = test_input.copy()  # Start with all default features
    
    # Update with provided data
    if data:
        input_data.update(data)
    
    # Add current timestamp-derived features if not provided
    if 'hour' not in input_data:
        now = datetime.now()
        input_data['hour'] = now.hour
        
    if 'day_of_week' not in input_data:
        now = datetime.now()
        input_data['day_of_week'] = now.weekday()
    
    # Ensure all required columns for the model are present
    required_columns = [
        "kitchen_consumption_L", "bathroom_consumption_L", 
        "garden_consumption_L", "other_consumption_L", 
        "total_consumption_L"
    ]
    
    for col in required_columns:
        if col not in input_data:
            input_data[col] = 0
    
    # Create DataFrame with a single row
    return pd.DataFrame([input_data])


def predict_consumption(input_df):
    """
    Make a water consumption prediction using the loaded pipeline
    """
    try:
        if pipeline is not None:
            # Use the model if available
            predicted_total_L = float(pipeline.predict(input_df)[0])
        else:
            # Fallback prediction logic if model is unavailable
            # Simple heuristic based on temperature, humidity, and season
            temp = input_df["temperature_C"].iloc[0]
            humidity = input_df["humidity_%"].iloc[0]
            season = input_df["season"].iloc[0].lower()
            
            # Base consumption
            base_consumption = 200
            
            # Adjust based on temperature (higher temp = more water)
            temp_factor = 1.0 + max(0, (temp - 25) / 50)
            
            # Adjust based on humidity (lower humidity = more water)
            humidity_factor = 1.0 - min(0.3, (humidity - 40) / 200)
            
            # Seasonal adjustment
            season_factors = {
                "summer": 1.3,
                "winter": 0.8,
                "monsoon": 0.7,
                "autumn": 0.9,
                "spring": 1.1
            }
            season_factor = season_factors.get(season, 1.0)
            
            # Calculate predicted consumption
            predicted_total_L = base_consumption * temp_factor * humidity_factor * season_factor
            
        return predicted_total_L
    except Exception as e:
        print(f"Prediction error: {e}")
        # Return a reasonable default value on error
        return 200.0  # Default to 200 liters


def allocate_water(total_L):
    """
    Allocate water to different zones based on the total predicted consumption
    """
    return {
        zone: round(total_L * weight, 2)
        for zone, weight in ZONE_ALLOCATION.items()
    }


@allocation_bp.route('/predict', methods=['GET'])
def predict_water_consumption():
    """
    Endpoint to predict water consumption using test data
    """
    try:
        # Prepare input data
        input_df = prepare_input_data()
        
        # Make prediction
        predicted_total_L = predict_consumption(input_df)
        
        # Allocate water usage into zones
        allocations = allocate_water(predicted_total_L)
        
        # Calculate rainwater amount - correctly access the value from input_df DataFrame
        rainwater_amount = RAINWATER_HARVESTED_L if input_df["rainwater_harvested_L"].iloc[0] > 0 else 0.0
        
        # Prepare response
        response_data = {
            "predicted_total_L": round(predicted_total_L, 2),
            "allocations": allocations,
            "rainwater_harvested_L": rainwater_amount,
            "input_data": {k: v for k, v in test_input.items() if k not in ["kitchen_consumption_L", "bathroom_consumption_L", "garden_consumption_L", "other_consumption_L", "total_consumption_L"]}
        }
        
        return jsonify(response_data)
        
    except Exception as e:
        import traceback
        traceback_str = traceback.format_exc()
        print(f"Error in predict_water_consumption: {str(e)}\n{traceback_str}")
        return jsonify({"error": f"Prediction error: {str(e)}"}), 500


@allocation_bp.route('/predict/custom', methods=['POST'])
def predict_custom():
    """
    Endpoint to predict water consumption with custom input values
    """
    try:
        # Get JSON data from request
        input_data = request.get_json()
        if not input_data:
            return jsonify({"error": "No input data provided"}), 400
        
        # Prepare input data
        input_df = prepare_input_data(input_data)
        
        # Make prediction
        predicted_total_L = predict_consumption(input_df)
        
        # Allocate water usage into zones
        allocations = allocate_water(predicted_total_L)
        
        # Calculate rainwater amount based on whether harvesting is active
        rainwater_amount = RAINWATER_HARVESTED_L if input_df["rainwater_harvested_L"].iloc[0] > 0 else 0.0
        
        # Prepare response
        response_data = {
            "predicted_total_L": round(predicted_total_L, 2),
            "allocations": allocations,
            "rainwater_harvested_L": rainwater_amount,
            "input_data": {k: v for k, v in input_data.items() if k not in ["kitchen_consumption_L", "bathroom_consumption_L", "garden_consumption_L", "other_consumption_L", "total_consumption_L"]}
        }
        
        return jsonify(response_data)
        
    except KeyError as e:
        return jsonify({"error": f"Missing required field: {str(e)}"}), 400
    except ValueError as e:
        return jsonify({"error": f"Invalid data format: {str(e)}"}), 400
    except Exception as e:
        import traceback
        traceback_str = traceback.format_exc()
        print(f"Error in predict_custom: {str(e)}\n{traceback_str}")
        return jsonify({"error": f"Prediction error: {str(e)}"}), 500