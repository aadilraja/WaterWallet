from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
from datetime import datetime
from twilio.rest import Client
import os

# Load environment variables
load_dotenv()

# Initialize extensions
db = SQLAlchemy()

# Globals
water_level = 0  # in cm
MOTOR_ON = False
MAX_WATER_LEVEL_CM = 3  # Threshold
NOTIFIED = False

# Dummy sensor and motor logic
def get_ultrasonic_level():
    global water_level
    return water_level

def stop_motor():
    global MOTOR_ON
    MOTOR_ON = False
    print("🛑 Motor stopped due to overflow.")

def send_notification():
    account_sid = os.getenv('TWILIO_ACCOUNT_SID')
    auth_token = os.getenv('TWILIO_AUTH_TOKEN')
    from_number = os.getenv('TWILIO_PHONE_FROM')
    to_number = os.getenv('TWILIO_PHONE_TO')

    message_body = f"🚨 Alert! Water level is {water_level} cm (threshold: {MAX_WATER_LEVEL_CM} cm). Motor stopped."

    try:
        client = Client(account_sid, auth_token)
        message = client.messages.create(
            body=message_body,
            from_=from_number,
            to=to_number
        )
        print("📱 SMS alert sent successfully.")
    except Exception as e:
        print(f"❌ Failed to send SMS alert: {e}")

# Models
class WaterUsage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    kitchen = db.Column(db.Float, nullable=False)
    bathroom = db.Column(db.Float, nullable=False)
    garden = db.Column(db.Float, nullable=False)
    outdoor = db.Column(db.Float, nullable=False)
    total = db.Column(db.Float, nullable=False)

class WaterData(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    flow_rate = db.Column(db.Float, nullable=False)
    total_consumption = db.Column(db.Float, nullable=False)
    pipe_pressure = db.Column(db.Float, nullable=False)
    leak_detected = db.Column(db.Boolean, default=False)
    prediction = db.Column(db.Float)

    # 🌡️ Additional features
    temperature_C = db.Column(db.Float, default=30)
    humidity_percent = db.Column(db.Float, default=60)
    rain_recent_mm = db.Column(db.Float, default=5)
    
    # 🌍 Location and environment
    state = db.Column(db.String(50), default="Karnataka")
    country = db.Column(db.String(50), default="India")  # <-- added missing 'country'
    season = db.Column(db.String(50), default="Summer")
    climate = db.Column(db.String(50), default="Tropical")
    
    # 🕒 Time-based
    hour = db.Column(db.Integer, default=14)
    day_of_week = db.Column(db.Integer, default=2)
    
    # 💧 Water-related control and features
    valve_state = db.Column(db.Integer, default=1)
    rainwater_harvested_L = db.Column(db.Float, default=100)
    
    # 📊 Extra metrics
    water_pressure = db.Column(db.Float, default=0)
    population_density = db.Column(db.Float, default=0)

def create_app():
    app = Flask(__name__)
    CORS(app, resources={r"/*": {"origins": "*"}})

    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///water_data.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)

    @app.route('/')
    def index():
        return jsonify({
            "status": "Water Management System is running",
            "endpoints": {
                "allocation": ["/allocation/predict", "/allocation/predict/custom"],
                "waterUsage": ["/waterUsage/addinfo", "/waterUsage/detail"],
                "waterData": ["/api/water-data"],
                "monitoring": ["/start_motor", "/update_level/<level>"]
            }
        })

    @app.route('/start_motor', methods=['POST'])
    def start_motor():
        global MOTOR_ON
        MOTOR_ON = True
        return jsonify({'message': 'Motor started'})

    @app.route('/update_level/<int:level>', methods=['POST'])
    def update_level(level):
        global water_level
        water_level = level
        if level > MAX_WATER_LEVEL_CM:
            send_notification()
            stop_motor()
            return jsonify({'message': 'Water is overflowing'})
        return jsonify({'message': f'Water level updated to {level} cm'})

    @app.route('/waterUsage/addinfo', methods=['POST'])
    def add_water_usage_info():
        try:
            data = request.get_json()
            if not data:
                return jsonify({'status': 'error', 'message': 'No JSON data provided'}), 400

            kitchen = float(data.get('kitchen', 0))
            bathroom = float(data.get('bathroom', 0))
            garden = float(data.get('garden', 0))
            outdoor=float(data.get('outdoor', 0))
            total = kitchen + bathroom + garden + outdoor

            usage = WaterUsage(
                kitchen=kitchen,
                bathroom=bathroom,
                garden = garden,
                outdoor = outdoor,
                total=total
            )
            db.session.add(usage)
            db.session.commit()

            return jsonify({
                'status': 'success',
                'message': 'Water usage data added successfully.',
                'data': {
                    'kitchen': kitchen,
                    'bathroom': bathroom,
                    'total': total
                }
            }), 200

        except Exception as e:
            db.session.rollback()
            return jsonify({'status': 'error', 'message': str(e)}), 500

    @app.route('/waterUsage/detail', methods=['GET'])
    def get_water_usage_detail():
        try:
            data = WaterUsage.query.order_by(WaterUsage.id.desc()).all()
            return jsonify({
                'status': 'success',
                'data': [{
                    'kitchen': entry.kitchen,
                    'bathroom': entry.bathroom,
                    'garden': entry.garden,
                    'outdoor' : entry.outdoor,
                    'total': entry.total
                } for entry in data]
            }), 200
        except Exception as e:
            return jsonify({'status': 'error', 'message': str(e)}), 500

    # Receive IoT sensor data with temperature field
    @app.route('/api/water-data', methods=['POST'])
    def receive_water_data():
        try:
            data = request.get_json()
            new_entry = WaterData(
                flow_rate=data.get('flow_rate'),
                total_consumption=data.get('total_consumption'),
                pipe_pressure=data.get('pipe_pressure'),
                leak_detected=data.get('leak_detected', False),
                prediction=data.get('prediction'),
            )
            db.session.add(new_entry)
            db.session.commit()
            return jsonify({'status': 'success', 'message': 'Sensor data stored'}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({'status': 'error', 'message': str(e)}), 500

    # Get all sensor data, including temperature
    @app.route('/api/water-data', methods=['GET'])
    def get_all_water_data():
        try:
            data = WaterData.query.order_by(WaterData.timestamp.desc()).all()
            return jsonify({
                'status': 'success',
                'data': [
                    {
                        'timestamp': entry.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
                        'flow_rate': entry.flow_rate,
                        'total_consumption': entry.total_consumption,
                        'pipe_pressure': entry.pipe_pressure,
                        'leak_detected': entry.leak_detected,
                        'prediction': entry.prediction,
                    } for entry in data
                ]
            }), 200
        except Exception as e:
            return jsonify({'status': 'error', 'message': str(e)}), 500
        
    @app.route('/allocation/predict/custom', methods=['GET', 'POST'])
    def predict_custom_allocation():
        if request.method == 'GET':
            return jsonify({
                "message": "This is the custom allocation prediction endpoint. Please send a POST request with data."
            })
        try:
            data = request.get_json()
            # Add your logic to handle prediction here
            # For now, just echo back the input with a dummy prediction
            return jsonify({
                "input": data,
                "prediction": 0.75  # Dummy response
            })
        except Exception as e:
            return jsonify({'status': 'error', 'message': str(e)}), 500


    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"error": "Endpoint not found"}), 404

    @app.errorhandler(500)
    def server_error(error):
        return jsonify({"error": f"Internal server error: {str(error)}"}), 500

    with app.app_context():
        db.create_all()

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, host="0.0.0.0", port=5000)

