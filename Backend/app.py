# Fix for app.py - Updated water usage module import

"""
Main Flask application entry point
Integrates the allocation module and water usage tracking
"""
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
from datetime import datetime
import os

# Load environment variables
load_dotenv()

# Initialize extensions
db = SQLAlchemy()

# Models
class WaterUsage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    kitchen = db.Column(db.Float, nullable=False)
    bathroom = db.Column(db.Float, nullable=False)
    garden = db.Column(db.Float, nullable=False)
    outdoor = db.Column(db.Float, nullable=False)
    total = db.Column(db.Float, nullable=False)
   

# Add the WaterData model from waterUsage.py
class WaterData(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    flow_rate = db.Column(db.Float, nullable=False)  # in liters per minute
    total_consumption = db.Column(db.Float, nullable=False)  # in liters
    pipe_pressure = db.Column(db.Float, nullable=False)  # in PSI
    leak_detected = db.Column(db.Boolean, default=False)
    prediction = db.Column(db.Float)  # ML model prediction

def create_app():
    """
    Create and configure the Flask application
    """
    app = Flask(__name__)
    CORS(app, resources={r"/*": {"origins": "*"}})  # Configure CORS for all routes

    # Database configuration
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///water_data.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)

    # Import blueprints inside the function to avoid circular imports
    from allocation.predictive_model import allocation_bp
    
    # Register blueprints
    app.register_blueprint(allocation_bp)
    
    # Try to import water_usage_bp - handle with try/except in case module isn't found
    try:
        # Import and register the water_usage blueprint
        from water_usage.waterUsage import water_usage_bp
        app.register_blueprint(water_usage_bp, url_prefix="/api")
    except ImportError:
        print("Warning: water_usage module not found. Some endpoints may not be available.")

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
                ],
                "waterData": [
                    "/api/water-data"
                ]
            }
        })

    # Add water usage endpoints
    @app.route('/waterUsage/addinfo', methods=['POST'])
    def add_water_usage_info():
        try:
            data = request.get_json()
            if not data:
                return jsonify({
                    'status': 'error',
                    'message': 'No JSON data provided'
                }), 400

            kitchen = data.get('kitchen', 0)
            bathroom = data.get('bathroom', 0)
            garden = data.get('garden', 0)
            outdoor = data.get('outdoor', 0)
           
            # Validate numeric input
            for field, value in [('kitchen', kitchen), ('bathroom', bathroom), 
                                ('garden', garden), ('outdoor', outdoor)]:
                try:
                    float(value)
                except (ValueError, TypeError):
                    return jsonify({
                        'status': 'error',
                        'message': f'Invalid value for {field}: must be a number'
                    }), 400

            # Convert to float to ensure consistent data type
            kitchen = float(kitchen)
            bathroom = float(bathroom)
            garden = float(garden)
            outdoor = float(outdoor)
            total = kitchen + bathroom + garden + outdoor

            usage = WaterUsage(
                kitchen=kitchen,
                bathroom=bathroom,
                garden=garden,
                outdoor=outdoor,
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
                    'garden': garden,
                    'outdoor': outdoor,
                    'total': total
                }
            }), 200

        except Exception as e:
            db.session.rollback()  # Rollback on error
            print(f"Error in add_water_usage_info: {str(e)}")
            return jsonify({
                'status': 'error',
                'message': str(e)
            }), 500

    @app.route('/waterUsage/detail', methods=['GET'])
    def get_water_usage_detail():
        try:
            data = WaterUsage.query.order_by(WaterUsage.id.desc()).all()

            if not data:
                return jsonify({
                    'status': 'success',
                    'data': []
                }), 200

            return jsonify({
                'status': 'success',
                'data': [{
                    'kitchen': entry.kitchen,
                    'bathroom': entry.bathroom,
                    'garden': entry.garden,
                    'outdoor': entry.outdoor,
                    'total': entry.total,
                 
                } for entry in data]
            }), 200

        except Exception as e:
            print(f"Error in get_water_usage_detail: {str(e)}")
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
        return jsonify({"error": f"Internal server error: {str(error)}"}), 500

    # Initialize DB
    with app.app_context():
        db.create_all()

    return app

if __name__ == "__main__":
    app = create_app()
    
    app.run(debug=True, host="0.0.0.0", port=8081)