"""
PD Voice Detect - ML Service API
Flask application for voice analysis and Parkinson's disease detection
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import logging
from datetime import datetime

from src.feature_extraction.voice_analyzer import VoiceAnalyzer
from src.models.ensemble_model import EnsembleModel
from src.utils.logger import setup_logger

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configuration
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # 10MB max file size
app.config['UPLOAD_FOLDER'] = os.getenv('UPLOAD_FOLDER', '/tmp/uploads')

# Setup logging
logger = setup_logger(__name__)

# Initialize ML components
voice_analyzer = VoiceAnalyzer()
ensemble_model = EnsembleModel()


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'service': 'ml-service',
        'version': '1.0.0'
    }), 200


@app.route('/api/ml/analyze', methods=['POST'])
def analyze_voice():
    """
    Analyze voice recording for Parkinson's disease detection
    
    Request body:
    {
        "audio_file_url": "s3://bucket/path/to/audio.wav",
        "patient_id": "uuid",
        "recording_type": "sustained_vowel"
    }
    
    Response:
    {
        "job_id": "uuid",
        "status": "processing",
        "estimated_time": 45
    }
    """
    try:
        data = request.get_json()
        
        # Validate input
        required_fields = ['audio_file_url', 'patient_id', 'recording_type']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'error': f'Missing required field: {field}'
                }), 400
        
        # Generate job ID
        import uuid
        job_id = str(uuid.uuid4())
        
        # Queue analysis job (in production, use Celery/Redis)
        # For now, process synchronously
        logger.info(f"Starting analysis for job {job_id}")
        
        # Download audio file from S3 (or local path)
        audio_path = data['audio_file_url']
        
        # Extract features
        features = voice_analyzer.extract_all(audio_path)
        
        # Run ensemble prediction
        prediction = ensemble_model.predict(features)
        risk_percentage = float(prediction['risk_percentage'])
        confidence = float(prediction['confidence'])
        
        # Calculate SHAP values for explainability
        shap_values = ensemble_model.explain_prediction(features)
        
        # Format biomarkers
        biomarkers = voice_analyzer.format_biomarkers(features)
        
        # Return results
        return jsonify({
            'job_id': job_id,
            'status': 'completed',
            'risk_percentage': risk_percentage,
            'confidence_level': confidence,
            'biomarkers': biomarkers,
            'shap_values': shap_values,
            'processed_at': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Error in analyze_voice: {str(e)}", exc_info=True)
        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
        }), 500


@app.route('/api/ml/results/<job_id>', methods=['GET'])
def get_results(job_id):
    """
    Get analysis results by job ID
    
    Response:
    {
        "job_id": "uuid",
        "status": "completed",
        "risk_percentage": 73.5,
        "confidence_level": 89.2,
        "biomarkers": {...},
        "shap_values": {...}
    }
    """
    # In production, retrieve from Redis/database
    # For now, return placeholder
    return jsonify({
        'error': 'Job results not found. Use /api/ml/analyze endpoint.'
    }), 404


@app.route('/api/ml/features', methods=['POST'])
def extract_features():
    """
    Extract voice features from audio file (for testing/debugging)
    
    Request: multipart/form-data with audio file
    Response: Extracted features
    """
    try:
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400
        
        audio_file = request.files['audio']
        
        # Save temporarily
        import tempfile
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as tmp_file:
            audio_file.save(tmp_file.name)
            tmp_path = tmp_file.name
        
        # Extract features
        features = voice_analyzer.extract_all(tmp_path)
        
        # Clean up
        os.unlink(tmp_path)
        
        return jsonify({
            'features': features,
            'extracted_at': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Error in extract_features: {str(e)}", exc_info=True)
        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
        }), 500


@app.errorhandler(413)
def request_entity_too_large(error):
    """Handle file too large error"""
    return jsonify({
        'error': 'File too large',
        'message': 'Maximum file size is 10MB'
    }), 413


@app.errorhandler(500)
def internal_error(error):
    """Handle internal server errors"""
    logger.error(f"Internal error: {str(error)}", exc_info=True)
    return jsonify({
        'error': 'Internal server error',
        'message': 'An unexpected error occurred'
    }), 500


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_ENV') == 'development'
    app.run(host='0.0.0.0', port=port, debug=debug)

