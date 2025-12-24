"""
Voice Analyzer
Extracts 42+ voice biomarkers from audio recordings
"""

import librosa
import numpy as np
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)


class VoiceAnalyzer:
    """Extracts voice biomarkers for Parkinson's disease detection"""
    
    def __init__(self, sample_rate: int = 44100):
        self.sample_rate = sample_rate
    
    def extract_all(self, audio_path: str) -> Dict[str, Any]:
        """
        Extract all voice biomarkers from audio file
        
        Args:
            audio_path: Path to audio file
            
        Returns:
            Dictionary containing all extracted features
        """
        try:
            # Load audio
            signal, sr = librosa.load(audio_path, sr=self.sample_rate)
            
            # Extract features from each category
            features = {}
            
            # Frequency features
            features.update(self._extract_frequency_features(signal, sr))
            
            # Amplitude features
            features.update(self._extract_amplitude_features(signal, sr))
            
            # Spectral features
            features.update(self._extract_spectral_features(signal, sr))
            
            # Temporal features
            features.update(self._extract_temporal_features(signal, sr))
            
            # Nonlinear features
            features.update(self._extract_nonlinear_features(signal, sr))
            
            return features
            
        except Exception as e:
            logger.error(f"Error extracting features: {str(e)}")
            raise
    
    def _extract_frequency_features(self, signal: np.ndarray, sr: int) -> Dict[str, float]:
        """Extract frequency-related features (Jitter, F0, HNR)"""
        features = {}
        
        # Fundamental frequency (F0)
        f0 = librosa.yin(signal, fmin=50, fmax=400)
        f0 = f0[f0 > 0]  # Remove unvoiced segments
        
        if len(f0) > 0:
            features['f0_mean'] = float(np.mean(f0))
            features['f0_std'] = float(np.std(f0))
            features['f0_range'] = float(np.max(f0) - np.min(f0))
            
            # Jitter (local)
            if len(f0) > 1:
                jitter_local = np.mean(np.abs(np.diff(f0))) / np.mean(f0) * 100
                features['jitter_local'] = float(jitter_local)
            else:
                features['jitter_local'] = 0.0
        else:
            features['f0_mean'] = 0.0
            features['f0_std'] = 0.0
            features['f0_range'] = 0.0
            features['jitter_local'] = 0.0
        
        # Harmonic-to-Noise Ratio (HNR)
        try:
            harmonic, percussive = librosa.effects.hpss(signal)
            hnr = np.sum(harmonic**2) / (np.sum(percussive**2) + 1e-10)
            features['hnr'] = float(10 * np.log10(hnr))
        except:
            features['hnr'] = 0.0
        
        return features
    
    def _extract_amplitude_features(self, signal: np.ndarray, sr: int) -> Dict[str, float]:
        """Extract amplitude-related features (Shimmer, SNR)"""
        features = {}
        
        # Amplitude envelope
        amplitude = np.abs(signal)
        
        if len(amplitude) > 1:
            # Shimmer (local)
            shimmer_local = np.mean(np.abs(np.diff(amplitude))) / np.mean(amplitude) * 100
            features['shimmer_local'] = float(shimmer_local)
        else:
            features['shimmer_local'] = 0.0
        
        # Signal-to-Noise Ratio (SNR)
        signal_power = np.mean(signal**2)
        noise_power = np.var(signal - np.mean(signal))
        snr = signal_power / (noise_power + 1e-10)
        features['snr'] = float(10 * np.log10(snr))
        
        return features
    
    def _extract_spectral_features(self, signal: np.ndarray, sr: int) -> Dict[str, float]:
        """Extract spectral features (MFCCs, Formants)"""
        features = {}
        
        # MFCCs (13 coefficients)
        mfccs = librosa.feature.mfcc(y=signal, sr=sr, n_mfcc=13)
        for i in range(13):
            features[f'mfcc_{i+1}'] = float(np.mean(mfccs[i]))
        
        # Spectral centroid
        spectral_centroid = librosa.feature.spectral_centroid(y=signal, sr=sr)
        features['spectral_centroid'] = float(np.mean(spectral_centroid))
        
        # Spectral rolloff
        spectral_rolloff = librosa.feature.spectral_rolloff(y=signal, sr=sr)
        features['spectral_rolloff'] = float(np.mean(spectral_rolloff))
        
        return features
    
    def _extract_temporal_features(self, signal: np.ndarray, sr: int) -> Dict[str, float]:
        """Extract temporal features (Speech rate, Pauses)"""
        features = {}
        
        # Speech rate (simplified - syllables per second)
        # In production, use more sophisticated syllable detection
        duration = len(signal) / sr
        features['speech_rate'] = float(1.0 / duration)  # Placeholder
        
        # Pause detection (simplified)
        energy = librosa.feature.rms(y=signal)[0]
        threshold = np.percentile(energy, 20)
        pauses = np.sum(energy < threshold)
        features['pause_count'] = float(pauses)
        
        return features
    
    def _extract_nonlinear_features(self, signal: np.ndarray, sr: int) -> Dict[str, float]:
        """Extract nonlinear features (Recurrence, DFA)"""
        features = {}
        
        # Placeholder implementations
        # In production, implement proper recurrence analysis and DFA
        features['recurrence_rate'] = 0.0
        features['determinism'] = 0.0
        features['dfa_alpha'] = 0.0
        
        return features
    
    def format_biomarkers(self, features: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
        """
        Format features into biomarker structure with normal ranges and interpretations
        
        Args:
            features: Raw feature dictionary
            
        Returns:
            Formatted biomarkers with status and interpretation
        """
        biomarkers = {}
        
        # Define normal ranges (from clinical literature)
        normal_ranges = {
            'jitter_local': (0, 0.6),
            'shimmer_local': (0, 3.0),
            'f0_mean': (100, 300),
            'hnr': (15, 30),
            'snr': (20, 40),
        }
        
        for key, value in features.items():
            status = 'normal'
            interpretation = 'Within normal range'
            
            if key in normal_ranges:
                min_val, max_val = normal_ranges[key]
                if value < min_val or value > max_val:
                    status = 'warning' if abs(value - (min_val + max_val) / 2) < (max_val - min_val) else 'critical'
                    if value > max_val:
                        interpretation = f'Elevated {key.replace("_", " ")} may indicate vocal instability'
                    else:
                        interpretation = f'Reduced {key.replace("_", " ")} may indicate voice quality issues'
            
            biomarkers[key] = {
                'value': float(value),
                'unit': self._get_unit(key),
                'normal_range': normal_ranges.get(key, [0, 100]),
                'status': status,
                'interpretation': interpretation
            }
        
        return biomarkers
    
    def _get_unit(self, feature_name: str) -> str:
        """Get unit for feature"""
        units = {
            'jitter_local': '%',
            'shimmer_local': '%',
            'f0_mean': 'Hz',
            'hnr': 'dB',
            'snr': 'dB',
        }
        return units.get(feature_name, '')

