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

# Define Water data model
class WaterData(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    flow_rate = db.Column(db.Float, nullable=False)  # in liters per minute
    total_consumption = db.Column(db.Float, nullable=False)  # in liters
    pipe_pressure = db.Column(db.Float, nullable=False)  # in PSI
    leak_detected = db.Column(db.Boolean, default=False)
    prediction = db.Column(db.Float)  # ML model prediction

# Load ML model (you'll need to train and save your model first)
try:
    model = joblib.load('model.pkl')
except:
    model = None

@app.route('/api/water-data', methods=['POST'])
def receive_water_data():
    try:
        data = request.get_json()
        
        # Extract water data
        flow_rate = data.get('flow_rate')
        total_consumption = data.get('total_consumption')
        pipe_pressure = data.get('pipe_pressure')
        leak_detected = data.get('leak_detected', False)
        
        # Validate required fields
        if None in (flow_rate, total_consumption, pipe_pressure):
            return jsonify({
                'status': 'error',
                'message': 'Missing required fields: flow_rate, total_consumption, pipe_pressure'
            }), 400
        
        # Make prediction if model is available
        prediction = None
        if model is not None:
            features = np.array([[flow_rate, pipe_pressure, total_consumption]])
            prediction = model.predict(features)[0]
        
        # Save to database
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

@app.route('/api/water-data', methods=['GET'])
def get_water_data():
    try:
        # Get query parameters for filtering
        limit = request.args.get('limit', default=100, type=int)
        leak_only = request.args.get('leak_only', default=False, type=bool)
        
        # Base query
        query = WaterData.query
        
        # Apply leak filter if requested
        if leak_only:
            query = query.filter(WaterData.leak_detected == True)
        
        # Get records ordered by timestamp
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

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, host='0.0.0.0', port=5000) 
