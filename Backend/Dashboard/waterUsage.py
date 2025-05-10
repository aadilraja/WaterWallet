from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import os
from dotenv import load_dotenv
import joblib
import numpy as np
from datetime import datetime

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///water_data.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# ------------------------
# Models
# ------------------------

# Existing WaterData model
class WaterData(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    flow_rate = db.Column(db.Float, nullable=False)  # in liters per minute
    total_consumption = db.Column(db.Float, nullable=False)  # in liters
    pipe_pressure = db.Column(db.Float, nullable=False)  # in PSI
    leak_detected = db.Column(db.Boolean, default=False)
    prediction = db.Column(db.Float)  # ML model prediction

# New WaterUsage model
class WaterUsage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    kitchen = db.Column(db.Float, nullable=False)       # in liters
    bathroom = db.Column(db.Float, nullable=False)      # in liters
    outdoor = db.Column(db.Float, nullable=False)       # in liters
    weather = db.Column(db.String(50))                  # sunny, rainy, etc.
    rainfall = db.Column(db.Float)                      # optional, in mm
    temperature = db.Column(db.Float)                   # optional, in Celsius

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

# Existing route to receive general water data
@app.route('/api/water-data', methods=['POST'])
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

# Existing route to get water data
@app.route('/api/water-data', methods=['GET'])
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

# ------------------------
# New WaterUsage routes
# ------------------------

@app.route('/waterUsage/addinfo', methods=['POST'])
def add_water_usage_info():
    try:
        data = request.get_json()

        kitchen = data.get('kitchen')
        bathroom = data.get('bathroom')
        outdoor = data.get('outdoor')
        weather = data.get('weather', 'unknown')
        rainfall = data.get('rainfall', None)
        temperature = data.get('temperature', None)

        if None in (kitchen, bathroom, outdoor):
            return jsonify({
                'status': 'error',
                'message': 'Missing required fields: kitchen, bathroom, outdoor'
            }), 400

        usage = WaterUsage(
            kitchen=kitchen,
            bathroom=bathroom,
            outdoor=outdoor,
            weather=weather,
            rainfall=rainfall,
            temperature=temperature
        )
        db.session.add(usage)
        db.session.commit()

        return jsonify({
            'status': 'success',
            'message': 'Water usage data added successfully.'
        }), 200

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/waterUsage/detail', methods=['GET'])
def get_water_usage_detail():
    try:
        data = WaterUsage.query.order_by(WaterUsage.timestamp.desc()).all()

        return jsonify({
            'status': 'success',
            'data': [{
                'timestamp': entry.timestamp.isoformat(),
                'kitchen': entry.kitchen,
                'bathroom': entry.bathroom,
                'outdoor': entry.outdoor,
                'weather': entry.weather,
                'rainfall': entry.rainfall,
                'temperature': entry.temperature
            } for entry in data]
        }), 200

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

# ------------------------
# Run App
# ------------------------
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, host='0.0.0.0', port=5000)
