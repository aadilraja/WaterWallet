"""
Main Flask application entry point
Integrates the allocation module and water usage tracking
"""
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
from allocation.predictive_model import allocation_bp
from datetime import datetime
import os

# Load environment variables
load_dotenv()

# Initialize extensions
db = SQLAlchemy()

# Models
class WaterUsage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    kitchen = db.Column(db.Float, nullable=False)
    bathroom = db.Column(db.Float, nullable=False)
    outdoor = db.Column(db.Float, nullable=False)
    weather = db.Column(db.String(50))
    rainfall = db.Column(db.Float)
    temperature = db.Column(db.Float)

def create_app():
    """
    Create and configure the Flask application
    """
    app = Flask(__name__)
    CORS(app)

    # Database configuration
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///water_data.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)

    # Register blueprint
    app.register_blueprint(allocation_bp)

    # Root endpoint
    @app.route('/')
    def index():
        return jsonify({
            "status": "Water Management System is running",
            "endpoints": {
                "allocation": [
                    "/allocation/predict",
                    "/allocation/predict/custom"
                ],
                "waterUsage": [
                    "/waterUsage/addinfo",
                    "/waterUsage/detail"
                ]
            }
        })

    # Add new water usage endpoints
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

    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"error": "Endpoint not found"}), 404

    @app.errorhandler(500)
    def server_error(error):
        return jsonify({"error": "Internal server error"}), 500

    # Initialize DB
    with app.app_context():
        db.create_all()

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, host="0.0.0.0", port=5000)

