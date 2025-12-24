"""
Model Training Script
Trains ensemble model for Parkinson's disease detection
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, classification_report
import xgboost as xgb
import joblib
import os
from pathlib import Path

# In production, load from actual dataset
# For now, using UCI Parkinson's dataset structure
def load_data():
    """
    Load training data
    In production, this would load from UCI Parkinson's dataset
    or custom clinical dataset
    """
    # Placeholder: Generate synthetic training data
    # In production, replace with actual data loading
    n_samples = 1000
    n_features = 42
    
    X = np.random.rand(n_samples, n_features)
    y = np.random.randint(0, 2, n_samples)
    
    return X, y

def train_random_forest(X_train, y_train):
    """Train Random Forest model"""
    print("Training Random Forest...")
    rf = RandomForestClassifier(
        n_estimators=200,
        max_depth=20,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )
    rf.fit(X_train, y_train)
    return rf

def train_xgboost(X_train, y_train):
    """Train XGBoost model"""
    print("Training XGBoost...")
    xgb_model = xgb.XGBClassifier(
        n_estimators=200,
        max_depth=6,
        learning_rate=0.1,
        random_state=42,
        eval_metric='logloss'
    )
    xgb_model.fit(X_train, y_train)
    return xgb_model

def train_neural_network(X_train, y_train):
    """Train Neural Network model"""
    print("Training Neural Network...")
    # In production, use TensorFlow/Keras
    # For now, placeholder
    from sklearn.neural_network import MLPClassifier
    
    nn = MLPClassifier(
        hidden_layer_sizes=(100, 50),
        max_iter=500,
        random_state=42
    )
    nn.fit(X_train, y_train)
    return nn

def evaluate_model(model, X_test, y_test, model_name):
    """Evaluate model performance"""
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, average='weighted')
    recall = recall_score(y_test, y_pred, average='weighted')
    
    print(f"\n{model_name} Performance:")
    print(f"Accuracy: {accuracy:.4f}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall: {recall:.4f}")
    
    return accuracy, precision, recall

def main():
    """Main training function"""
    print("=" * 50)
    print("Parkinson's Disease Detection - Model Training")
    print("=" * 50)
    
    # Load data
    print("\nLoading data...")
    X, y = load_data()
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print(f"Training set: {X_train.shape[0]} samples")
    print(f"Test set: {X_test.shape[0]} samples")
    
    # Train models
    rf_model = train_random_forest(X_train, y_train)
    xgb_model = train_xgboost(X_train, y_train)
    nn_model = train_neural_network(X_train, y_train)
    
    # Evaluate models
    print("\n" + "=" * 50)
    print("Model Evaluation")
    print("=" * 50)
    
    rf_acc, rf_prec, rf_rec = evaluate_model(rf_model, X_test, y_test, "Random Forest")
    xgb_acc, xgb_prec, xgb_rec = evaluate_model(xgb_model, X_test, y_test, "XGBoost")
    nn_acc, nn_prec, nn_rec = evaluate_model(nn_model, X_test, y_test, "Neural Network")
    
    # Cross-validation
    print("\n" + "=" * 50)
    print("Cross-Validation (k=10)")
    print("=" * 50)
    
    rf_cv = cross_val_score(rf_model, X_train, y_train, cv=10, scoring='accuracy')
    xgb_cv = cross_val_score(xgb_model, X_train, y_train, cv=10, scoring='accuracy')
    nn_cv = cross_val_score(nn_model, X_train, y_train, cv=10, scoring='accuracy')
    
    print(f"Random Forest CV Accuracy: {rf_cv.mean():.4f} (+/- {rf_cv.std() * 2:.4f})")
    print(f"XGBoost CV Accuracy: {xgb_cv.mean():.4f} (+/- {xgb_cv.std() * 2:.4f})")
    print(f"Neural Network CV Accuracy: {nn_cv.mean():.4f} (+/- {nn_cv.std() * 2:.4f})")
    
    # Save models
    models_dir = Path('models')
    models_dir.mkdir(exist_ok=True)
    
    print("\n" + "=" * 50)
    print("Saving Models")
    print("=" * 50)
    
    joblib.dump(rf_model, models_dir / 'random_forest.pkl')
    joblib.dump(xgb_model, models_dir / 'xgboost.pkl')
    joblib.dump(nn_model, models_dir / 'neural_network.pkl')
    
    print("Models saved successfully!")
    print(f"Model directory: {models_dir.absolute()}")
    
    # Ensemble performance (weighted voting)
    print("\n" + "=" * 50)
    print("Ensemble Performance")
    print("=" * 50)
    
    rf_pred = rf_model.predict_proba(X_test)[:, 1]
    xgb_pred = xgb_model.predict_proba(X_test)[:, 1]
    nn_pred = nn_model.predict_proba(X_test)[:, 1]
    
    # Weighted ensemble (XGBoost gets higher weight)
    ensemble_pred = (0.3 * rf_pred + 0.4 * xgb_pred + 0.3 * nn_pred)
    ensemble_pred_binary = (ensemble_pred > 0.5).astype(int)
    
    ensemble_acc = accuracy_score(y_test, ensemble_pred_binary)
    ensemble_prec = precision_score(y_test, ensemble_pred_binary, average='weighted')
    ensemble_rec = recall_score(y_test, ensemble_pred_binary, average='weighted')
    
    print(f"Ensemble Accuracy: {ensemble_acc:.4f}")
    print(f"Ensemble Precision: {ensemble_prec:.4f}")
    print(f"Ensemble Recall: {ensemble_rec:.4f}")
    
    print("\n" + "=" * 50)
    print("Training Complete!")
    print("=" * 50)

if __name__ == '__main__':
    main()

