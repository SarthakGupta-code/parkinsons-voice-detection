/**
 * Recording Screen
 * Voice recording interface with real-time feedback
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Audio } from 'expo-av';
import AudioService, { RecordingMetadata } from '../../services/audioService';
import ApiService from '../../services/api';
import StorageService from '../../services/storageService';
import { COLORS, SPACING, TYPOGRAPHY, RECORDING_TYPES } from '../../constants';

interface RecordingScreenProps {
  route: {
    params: {
      patientId: string;
      recordingType: string;
    };
  };
}

const RecordingScreen: React.FC<RecordingScreenProps> = ({ route }) => {
  const { patientId, recordingType } = route.params;
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [qualityScore, setQualityScore] = useState(0);
  const [volumeDb, setVolumeDb] = useState(-20);
  const [uploading, setUploading] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const hasPermission = await AudioService.requestPermissions();
      if (!hasPermission) {
        Alert.alert('Permission Denied', 'Microphone permission is required');
        return;
      }

      await AudioService.startRecording();
      setIsRecording(true);
      setDuration(0);

      // Update duration every second
      intervalRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    try {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      const uri = await AudioService.stopRecording();
      setIsRecording(false);

      // Get metadata
      const metadata = await AudioService.getMetadata(uri);
      setQualityScore(metadata.qualityScore);
      setVolumeDb(metadata.volumeDb);

      // Validate quality
      const validation = AudioService.validateQuality(metadata);
      if (!validation.isValid) {
        Alert.alert(
          'Quality Warning',
          `Recording quality issues:\n${validation.issues.join('\n')}\n\nDo you want to retry?`,
          [
            { text: 'Retry', onPress: startRecording },
            { text: 'Use This', onPress: () => uploadRecording(uri, metadata) },
          ]
        );
        return;
      }

      await uploadRecording(uri, metadata);
    } catch (error) {
      Alert.alert('Error', 'Failed to stop recording');
    }
  };

  const uploadRecording = async (uri: string, metadata: RecordingMetadata) => {
    setUploading(true);
    try {
      // Check if online
      const isOnline = true; // In production, check network status

      if (isOnline) {
        // Upload directly
        await ApiService.uploadRecording(uri, patientId, recordingType, {
          duration: metadata.duration,
          qualityScore: metadata.qualityScore,
        });
        Alert.alert('Success', 'Recording uploaded successfully');
      } else {
        // Save for offline sync
        await StorageService.savePendingRecording({
          id: `${Date.now()}`,
          patient_id: patientId,
          recording_type: recordingType,
          file_uri: uri,
          metadata: JSON.stringify(metadata),
          created_at: new Date().toISOString(),
        });
        Alert.alert('Saved', 'Recording saved for upload when online');
      }
    } catch (error: any) {
      Alert.alert('Upload Failed', error.message || 'Failed to upload recording');
    } finally {
      setUploading(false);
    }
  };

  const getRecordingTypeLabel = () => {
    const labels: Record<string, string> = {
      [RECORDING_TYPES.SUSTAINED_VOWEL]: 'Sustained Vowel "Ahhh"',
      [RECORDING_TYPES.RAPID_SYLLABLE]: 'Rapid Syllable "pa-ta-ka"',
      [RECORDING_TYPES.READING_PASSAGE]: 'Reading Passage',
      [RECORDING_TYPES.SPONTANEOUS_SPEECH]: 'Spontaneous Speech',
    };
    return labels[recordingType] || 'Voice Recording';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{getRecordingTypeLabel()}</Text>

      <View style={styles.recordingArea}>
        {isRecording ? (
          <>
            <View style={styles.recordingIndicator} />
            <Text style={styles.duration}>{duration}s</Text>
            <Text style={styles.instruction}>Recording... Speak clearly</Text>
            
            <View style={styles.qualityInfo}>
              <Text style={styles.qualityText}>Volume: {volumeDb.toFixed(1)} dB</Text>
              <Text style={styles.qualityText}>Quality: {qualityScore}%</Text>
            </View>
          </>
        ) : (
          <Text style={styles.instruction}>Tap the button to start recording</Text>
        )}
      </View>

      <TouchableOpacity
        style={[styles.recordButton, isRecording && styles.recordButtonActive]}
        onPress={isRecording ? stopRecording : startRecording}
        disabled={uploading}
      >
        {uploading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.recordButtonText}>
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.lg,
  },
  title: {
    ...TYPOGRAPHY.h2,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    color: COLORS.text.primary,
  },
  recordingArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingIndicator: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.error,
    marginBottom: SPACING.lg,
  },
  duration: {
    ...TYPOGRAPHY.h1,
    color: COLORS.primary,
    marginBottom: SPACING.md,
  },
  instruction: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  qualityInfo: {
    marginTop: SPACING.lg,
  },
  qualityText: {
    ...TYPOGRAPHY.caption,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  recordButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  recordButtonActive: {
    backgroundColor: COLORS.error,
  },
  recordButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default RecordingScreen;

