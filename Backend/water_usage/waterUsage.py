"""
Water usage data processing routes (Blueprint)
"""
from flask import Blueprint, request, jsonify
import numpy as np
import joblib
from app import db, WaterData

# Create the blueprint
water_usage_bp = Blueprint('water_usage', __name__)

# ------------------------
# Load ML model
# ------------------------
try:
    model = joblib.load('model.pkl')
except:
    model = None

# ------------------------
# Routes
# ------------------------

# Route to receive general water data
@water_usage_bp.route('/water-data', methods=['POST'])
def receive_water_data():
    try:
        data = request.get_json()
        flow_rate = data.get('flow_rate')
        total_consumption = data.get('total_consumption')
        pipe_pressure = data.get('pipe_pressure')
        leak_detected = data.get('leak_detected', False)
        
        if None in (flow_rate, total_consumption, pipe_pressure):
            return jsonify({
                'status': 'error',
                'message': 'Missing required fields: flow_rate, total_consumption, pipe_pressure'
            }), 400
        
        prediction = None
        if model is not None:
            features = np.array([[flow_rate, pipe_pressure, total_consumption]])
            prediction = model.predict(features)[0]
        
        water_data = WaterData(
            flow_rate=flow_rate,
            total_consumption=total_consumption,
            pipe_pressure=pipe_pressure,
            leak_detected=leak_detected,
            prediction=prediction
        )
        db.session.add(water_data)
        db.session.commit()
        
        return jsonify({
            'status': 'success',
            'message': 'Water data received and processed',
            'prediction': float(prediction) if prediction is not None else None
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

# Route to get water data
@water_usage_bp.route('/water-data', methods=['GET'])
def get_water_data():
    try:
        limit = request.args.get('limit', default=100, type=int)
        leak_only = request.args.get('leak_only', default=False, type=bool)
        
        query = WaterData.query
        if leak_only:
            query = query.filter(WaterData.leak_detected == True)
        
        data = query.order_by(WaterData.timestamp.desc()).limit(limit).all()
        
        return jsonify({
            'status': 'success',
            'data': [{
                'timestamp': record.timestamp.isoformat(),
                'flow_rate': record.flow_rate,
                'total_consumption': record.total_consumption,
                'pipe_pressure': record.pipe_pressure,
                'leak_detected': record.leak_detected,
                'prediction': record.prediction
            } for record in data]
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500