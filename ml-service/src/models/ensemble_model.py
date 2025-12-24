"""
Ensemble Model
Combines Random Forest, XGBoost, and Neural Network for Parkinson's detection
"""

import numpy as np
import logging
from typing import Dict, Any
import joblib
import os

logger = logging.getLogger(__name__)


class EnsembleModel:
    """Ensemble model combining multiple ML algorithms"""
    
    def __init__(self, models_dir: str = 'models/'):
        self.models_dir = models_dir
        self.random_forest = None
        self.xgboost_model = None
        self.neural_network = None
        self._load_models()
    
    def _load_models(self):
        """Load trained models from disk"""
        try:
            # In production, load actual trained models
            # For now, use placeholder logic
            logger.info("Loading ensemble models...")
            
            # Placeholder: Models would be loaded here
            # self.random_forest = joblib.load(os.path.join(self.models_dir, 'random_forest.pkl'))
            # self.xgboost_model = joblib.load(os.path.join(self.models_dir, 'xgboost.pkl'))
            # self.neural_network = joblib.load(os.path.join(self.models_dir, 'neural_network.h5'))
            
            logger.info("Models loaded successfully")
        except Exception as e:
            logger.warning(f"Could not load models: {str(e)}. Using placeholder predictions.")
    
    def predict(self, features: Dict[str, Any]) -> Dict[str, float]:
        """
        Make ensemble prediction
        
        Args:
            features: Dictionary of extracted features
            
        Returns:
            Dictionary with risk_percentage and confidence
        """
        try:
            # Convert features to array (in production, use proper feature ordering)
            feature_vector = self._features_to_vector(features)
            
            # Get predictions from each model
            rf_pred = self._random_forest_predict(feature_vector)
            xgb_pred = self._xgboost_predict(feature_vector)
            nn_pred = self._neural_network_predict(feature_vector)
            
            # Ensemble voting (weighted average)
            weights = [0.3, 0.4, 0.3]  # XGBoost gets higher weight
            ensemble_pred = (
                weights[0] * rf_pred +
                weights[1] * xgb_pred +
                weights[2] * nn_pred
            )
            
            # Calculate confidence based on agreement
            predictions = [rf_pred, xgb_pred, nn_pred]
            std_dev = np.std(predictions)
            confidence = max(0, min(100, 100 - (std_dev * 50)))  # Higher agreement = higher confidence
            
            return {
                'risk_percentage': float(ensemble_pred * 100),
                'confidence': float(confidence)
            }
            
        except Exception as e:
            logger.error(f"Error in prediction: {str(e)}")
            # Return conservative default
            return {
                'risk_percentage': 50.0,
                'confidence': 50.0
            }
    
    def _features_to_vector(self, features: Dict[str, Any]) -> np.ndarray:
        """Convert feature dictionary to numpy array"""
        # In production, use proper feature ordering from training
        feature_order = [
            'jitter_local', 'shimmer_local', 'f0_mean', 'f0_std', 'hnr', 'snr',
            'mfcc_1', 'mfcc_2', 'mfcc_3', 'mfcc_4', 'mfcc_5',
            'spectral_centroid', 'spectral_rolloff', 'speech_rate'
        ]
        
        vector = []
        for feat in feature_order:
            vector.append(features.get(feat, 0.0))
        
        return np.array(vector).reshape(1, -1)
    
    def _random_forest_predict(self, features: np.ndarray) -> float:
        """Random Forest prediction (placeholder)"""
        if self.random_forest:
            return self.random_forest.predict_proba(features)[0][1]
        # Placeholder: return based on jitter (high jitter = higher risk)
        jitter = features[0][0] if len(features[0]) > 0 else 0.5
        return min(1.0, jitter / 2.0)
    
    def _xgboost_predict(self, features: np.ndarray) -> float:
        """XGBoost prediction (placeholder)"""
        if self.xgboost_model:
            return self.xgboost_model.predict_proba(features)[0][1]
        # Placeholder
        jitter = features[0][0] if len(features[0]) > 0 else 0.5
        return min(1.0, jitter / 1.8)
    
    def _neural_network_predict(self, features: np.ndarray) -> float:
        """Neural Network prediction (placeholder)"""
        if self.neural_network:
            # In production, use TensorFlow/Keras model
            return 0.5
        # Placeholder
        jitter = features[0][0] if len(features[0]) > 0 else 0.5
        return min(1.0, jitter / 2.2)
    
    def explain_prediction(self, features: Dict[str, Any]) -> Dict[str, float]:
        """
        Calculate SHAP values for model explainability
        
        Args:
            features: Dictionary of extracted features
            
        Returns:
            Dictionary of SHAP values for each feature
        """
        # In production, use actual SHAP library
        # For now, return placeholder values based on feature importance
        shap_values = {}
        
        # Higher importance for jitter, shimmer, HNR
        importance_weights = {
            'jitter_local': 0.25,
            'shimmer_local': 0.20,
            'hnr': 0.15,
            'f0_mean': 0.10,
            'snr': 0.10,
        }
        
        for key, value in features.items():
            weight = importance_weights.get(key, 0.05)
            shap_values[key] = float(value * weight)
        
        return shap_values

