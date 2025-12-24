/**
 * Audio Service
 * Handles voice recording and audio processing
 */

import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

export interface RecordingMetadata {
  duration: number;
  qualityScore: number;
  volumeDb: number;
  claritySnr: number;
  stabilityZcr: number;
}

class AudioService {
  private recording: Audio.Recording | null = null;
  private recordingUri: string | null = null;

  /**
   * Request audio permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Permission request error:', error);
      return false;
    }
  }

  /**
   * Start recording
   */
  async startRecording(): Promise<void> {
    try {
      // Set audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Create recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        (status) => {
          // Monitor recording status
          if (status.isRecording) {
            // Calculate quality metrics in real-time
            this.calculateQualityMetrics(status);
          }
        }
      );

      this.recording = recording;
    } catch (error) {
      console.error('Start recording error:', error);
      throw error;
    }
  }

  /**
   * Stop recording
   */
  async stopRecording(): Promise<string> {
    if (!this.recording) {
      throw new Error('No active recording');
    }

    try {
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      
      if (!uri) {
        throw new Error('Recording URI not available');
      }

      this.recordingUri = uri;
      this.recording = null;

      return uri;
    } catch (error) {
      console.error('Stop recording error:', error);
      throw error;
    }
  }

  /**
   * Get recording metadata
   */
  async getMetadata(uri: string): Promise<RecordingMetadata> {
    try {
      const info = await FileSystem.getInfoAsync(uri);
      
      // In production, use audio analysis library to get actual metrics
      // For now, return placeholder values
      return {
        duration: 10.0, // Would calculate from audio file
        qualityScore: 85,
        volumeDb: -12.0,
        claritySnr: 25.0,
        stabilityZcr: 0.15,
      };
    } catch (error) {
      console.error('Get metadata error:', error);
      throw error;
    }
  }

  /**
   * Calculate quality metrics (placeholder)
   */
  private calculateQualityMetrics(status: any) {
    // In production, analyze audio buffer in real-time
    // Calculate volume, SNR, ZCR from audio samples
  }

  /**
   * Validate recording quality
   */
  validateQuality(metadata: RecordingMetadata): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    if (metadata.volumeDb < -20) {
      issues.push('Volume too low');
    }
    if (metadata.volumeDb > -5) {
      issues.push('Volume too high (clipping)');
    }
    if (metadata.claritySnr < 15) {
      issues.push('Background noise detected');
    }
    if (metadata.qualityScore < 60) {
      issues.push('Poor recording quality');
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  /**
   * Cancel recording
   */
  async cancelRecording(): Promise<void> {
    if (this.recording) {
      await this.recording.stopAndUnloadAsync();
      this.recording = null;
    }
    if (this.recordingUri) {
      await FileSystem.deleteAsync(this.recordingUri, { idempotent: true });
      this.recordingUri = null;
    }
  }
}

export default new AudioService();

