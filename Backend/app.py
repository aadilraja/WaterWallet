"""
Main Flask application entry point
Integrates the allocation module
"""
from flask import Flask, jsonify

# Import blueprint from allocation module
from allocation.predictive_model import allocation_bp

def create_app():
    """
    Create and configure the Flask application
    """
    app = Flask(__name__)
    
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
                ]
            }
        })
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"error": "Endpoint not found"}), 404
    
    @app.errorhandler(500)
    def server_error(error):
        return jsonify({"error": "Internal server error"}), 500
    
    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, host="0.0.0.0", port=5000)