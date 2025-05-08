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

# Load the model
try:
    model_path ='allocation/water_optimization_model.pkl'
    pipeline = joblib.load(model_path)
    print("Water optimization model loaded successfully")
except Exception as e:
    print(f"Error loading model: {e}")
    pipeline = None

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
    # any other numeric features set to 0
    "water_pressure": 0,
    "population_density": 0
}

# Water allocation weights by zone
ZONE_ALLOCATION = {
    "kitchen_L": 0.35,
    "bathroom_L": 0.40,
    "garden_L": 0.15,
    "other_L": 0.10
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
    input_data = data.copy()
    
    # Add current timestamp-derived features if not provided
    if 'hour' not in input_data:
        now = datetime.now()
        input_data['hour'] = now.hour
        
    if 'day_of_week' not in input_data:
        now = datetime.now()
        input_data['day_of_week'] = now.weekday()
    
    # Create DataFrame with a single row
    return pd.DataFrame([input_data])


def predict_consumption(input_df):
    """
    Make a water consumption prediction using the loaded pipeline
    """
    if pipeline is None:
        return {"error": "Model not loaded. Please check server logs."}, 500
    
    try:
        # Make prediction
        predicted_total_L = float(pipeline.predict(input_df)[0])
        return predicted_total_L
    except Exception as e:
        print(f"Prediction error: {e}")
        return None


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
        if isinstance(predicted_total_L, tuple):  # Error case
            return predicted_total_L
        
        # Allocate water usage into zones
        allocations = allocate_water(predicted_total_L)
        
        # Calculate rainwater amount
        rainwater_amount = RAINWATER_HARVESTED_L if test_input.get("rainwater_harvested", False) else 0.0
        
        # Prepare response
        response_data = {
            "predicted_total_L": round(predicted_total_L, 2),
            "allocations": allocations,
            "rainwater_harvested_L": rainwater_amount,
            "input_data": {k: v for k, v in test_input.items()}
        }
        
        return jsonify(response_data)
        
    except Exception as e:
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
        if isinstance(predicted_total_L, tuple):  # Error case
            return predicted_total_L
        
        # Allocate water usage into zones
        allocations = allocate_water(predicted_total_L)
        
        # Calculate rainwater amount based on whether harvesting is active
        rainwater_amount = RAINWATER_HARVESTED_L if input_data.get("rainwater_harvested", False) else 0.0
        
        # Prepare response
        response_data = {
            "predicted_total_L": round(predicted_total_L, 2),
            "allocations": allocations,
            "rainwater_harvested_L": rainwater_amount,
            "input_data": {k: v for k, v in input_data.items()}
        }
        
        return jsonify(response_data)
        
    except KeyError as e:
        return jsonify({"error": f"Missing required field: {str(e)}"}), 400
    except ValueError as e:
        return jsonify({"error": f"Invalid data format: {str(e)}"}), 400
    except Exception as e:
        return jsonify({"error": f"Prediction error: {str(e)}"}), 500