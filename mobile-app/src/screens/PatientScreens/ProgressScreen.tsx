/**
 * Progress Tracking Screen
 * Shows patient's voice analysis history over time
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import ApiService from '../../services/api';
import { COLORS, SPACING, TYPOGRAPHY, RISK_LEVELS } from '../../constants';

interface ProgressScreenProps {
  route: {
    params: {
      patientId: string;
    };
  };
}

const ProgressScreen: React.FC<ProgressScreenProps> = ({ route }) => {
  const { patientId } = route.params;
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await ApiService.getPatientHistory(patientId);
      setHistory(data || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load progress history');
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevel = (risk: number) => {
    if (risk <= RISK_LEVELS.LOW.max) return RISK_LEVELS.LOW;
    if (risk <= RISK_LEVELS.MODERATE.max) return RISK_LEVELS.MODERATE;
    return RISK_LEVELS.HIGH;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Progress Tracking</Text>
        <Text style={styles.subtitle}>
          Voice analysis history over time
        </Text>
      </View>

      {history.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No analysis history yet</Text>
        </View>
      ) : (
        <View style={styles.historyList}>
          {history.map((item, index) => {
            const riskLevel = getRiskLevel(item.risk_percentage);
            return (
              <View key={item.id || index} style={styles.historyCard}>
                <View style={styles.historyHeader}>
                  <Text style={styles.historyDate}>
                    {formatDate(item.analyzed_at || item.recorded_at)}
                  </Text>
                  <View
                    style={[
                      styles.riskBadge,
                      { backgroundColor: riskLevel.color + '20' },
                    ]}
                  >
                    <Text style={[styles.riskText, { color: riskLevel.color }]}>
                      {item.risk_percentage.toFixed(1)}%
                    </Text>
                  </View>
                </View>
                <View style={styles.historyDetails}>
                  <Text style={styles.detailItem}>
                    Confidence: {item.confidence_level?.toFixed(1) || 'N/A'}%
                  </Text>
                  <Text style={styles.detailItem}>
                    Type: {item.recording_type?.replace(/_/g, ' ') || 'N/A'}
                  </Text>
                </View>
                {index < history.length - 1 && <View style={styles.divider} />}
              </View>
            );
          })}
        </View>
      )}

      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Summary</Text>
        <View style={styles.summaryStats}>
          <View style={styles.summaryStat}>
            <Text style={styles.summaryNumber}>{history.length}</Text>
            <Text style={styles.summaryLabel}>Total Tests</Text>
          </View>
          <View style={styles.summaryStat}>
            <Text style={styles.summaryNumber}>
              {history.length > 0
                ? history[0].risk_percentage.toFixed(1)
                : 'N/A'}
              %
            </Text>
            <Text style={styles.summaryLabel}>Latest Risk</Text>
          </View>
          <View style={styles.summaryStat}>
            <Text style={styles.summaryNumber}>
              {history.length > 0
                ? Math.round(
                    (new Date().getTime() -
                      new Date(history[history.length - 1].analyzed_at).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )
                : 'N/A'}
            </Text>
            <Text style={styles.summaryLabel}>Days Tracked</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: SPACING.lg,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    ...TYPOGRAPHY.h2,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
  },
  emptyState: {
    padding: SPACING.xxl,
    alignItems: 'center',
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.secondary,
  },
  historyList: {
    padding: SPACING.md,
  },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#eee',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  historyDate: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
  },
  riskBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 20,
  },
  riskText: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
  },
  historyDetails: {
    marginTop: SPACING.xs,
  },
  detailItem: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginTop: SPACING.md,
  },
  summary: {
    padding: SPACING.lg,
    backgroundColor: '#fff',
    margin: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  summaryTitle: {
    ...TYPOGRAPHY.h3,
    marginBottom: SPACING.md,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryStat: {
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  summaryLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
  },
});

export default ProgressScreen;

