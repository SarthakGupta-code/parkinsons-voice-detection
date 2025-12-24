/**
 * Storage Service
 * Handles offline data storage using SQLite
 */

import * as SQLite from 'expo-sqlite';

interface PendingRecording {
  id: string;
  patient_id: string;
  recording_type: string;
  file_uri: string;
  metadata: string;
  created_at: string;
}

class StorageService {
  private db: SQLite.SQLiteDatabase | null = null;

  /**
   * Initialize database
   */
  async initialize(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync('pd_voice_detect.db');
      
      // Create tables
      await this.createTables();
    } catch (error) {
      console.error('Database initialization error:', error);
      throw error;
    }
  }

  /**
   * Create database tables
   */
  private async createTables(): Promise<void> {
    if (!this.db) return;

    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS pending_recordings (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        recording_type TEXT NOT NULL,
        file_uri TEXT NOT NULL,
        metadata TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS cached_results (
        recording_id TEXT PRIMARY KEY,
        analysis_data TEXT NOT NULL,
        cached_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY,
        action TEXT NOT NULL,
        data TEXT NOT NULL,
        retry_count INTEGER DEFAULT 0,
        created_at TEXT NOT NULL
      );
    `);
  }

  /**
   * Save pending recording (offline)
   */
  async savePendingRecording(recording: PendingRecording): Promise<void> {
    if (!this.db) await this.initialize();

    await this.db!.runAsync(
      `INSERT INTO pending_recordings (id, patient_id, recording_type, file_uri, metadata, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        recording.id,
        recording.patient_id,
        recording.recording_type,
        recording.file_uri,
        JSON.stringify(recording.metadata),
        recording.created_at,
      ]
    );
  }

  /**
   * Get pending recordings
   */
  async getPendingRecordings(): Promise<PendingRecording[]> {
    if (!this.db) await this.initialize();

    const result = await this.db!.getAllAsync<PendingRecording>(
      'SELECT * FROM pending_recordings ORDER BY created_at ASC'
    );

    return result.map((row) => ({
      ...row,
      metadata: JSON.parse(row.metadata || '{}'),
    }));
  }

  /**
   * Delete pending recording
   */
  async deletePendingRecording(id: string): Promise<void> {
    if (!this.db) await this.initialize();

    await this.db!.runAsync('DELETE FROM pending_recordings WHERE id = ?', [id]);
  }

  /**
   * Cache analysis results
   */
  async cacheResults(recordingId: string, analysisData: any): Promise<void> {
    if (!this.db) await this.initialize();

    await this.db!.runAsync(
      `INSERT OR REPLACE INTO cached_results (recording_id, analysis_data, cached_at)
       VALUES (?, ?, ?)`,
      [recordingId, JSON.stringify(analysisData), new Date().toISOString()]
    );
  }

  /**
   * Get cached results
   */
  async getCachedResults(recordingId: string): Promise<any | null> {
    if (!this.db) await this.initialize();

    const result = await this.db!.getFirstAsync<{ analysis_data: string }>(
      'SELECT analysis_data FROM cached_results WHERE recording_id = ?',
      [recordingId]
    );

    return result ? JSON.parse(result.analysis_data) : null;
  }

  /**
   * Add to sync queue
   */
  async addToSyncQueue(action: string, data: any): Promise<void> {
    if (!this.db) await this.initialize();

    const id = `${Date.now()}-${Math.random()}`;
    await this.db!.runAsync(
      `INSERT INTO sync_queue (id, action, data, created_at)
       VALUES (?, ?, ?, ?)`,
      [id, action, JSON.stringify(data), new Date().toISOString()]
    );
  }

  /**
   * Get sync queue items
   */
  async getSyncQueue(): Promise<any[]> {
    if (!this.db) await this.initialize();

    const result = await this.db!.getAllAsync<{ id: string; action: string; data: string; retry_count: number }>(
      'SELECT * FROM sync_queue ORDER BY created_at ASC LIMIT 50'
    );

    return result.map((row) => ({
      id: row.id,
      action: row.action,
      data: JSON.parse(row.data),
      retryCount: row.retry_count,
    }));
  }

  /**
   * Remove from sync queue
   */
  async removeFromSyncQueue(id: string): Promise<void> {
    if (!this.db) await this.initialize();

    await this.db!.runAsync('DELETE FROM sync_queue WHERE id = ?', [id]);
  }
}

export default new StorageService();

