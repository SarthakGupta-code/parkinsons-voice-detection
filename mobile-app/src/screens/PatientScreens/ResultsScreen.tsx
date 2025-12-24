/**
 * Results Screen
 * Displays analysis results and risk assessment
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import ApiService from '../../services/api';
import { COLORS, SPACING, TYPOGRAPHY, RISK_LEVELS } from '../../constants';

interface ResultsScreenProps {
  route: {
    params: {
      recordingId: string;
    };
  };
}

const ResultsScreen: React.FC<ResultsScreenProps> = ({ route }) => {
  const { recordingId } = route.params;
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      setLoading(true);
      const analysis = await ApiService.getAnalysisResults(recordingId);
      setResults(analysis);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevel = (risk: number) => {
    if (risk <= RISK_LEVELS.LOW.max) return RISK_LEVELS.LOW;
    if (risk <= RISK_LEVELS.MODERATE.max) return RISK_LEVELS.MODERATE;
    return RISK_LEVELS.HIGH;
  };

  const downloadPDF = async () => {
    try {
      const pdf = await ApiService.generatePDF(recordingId);
      // In production, save and open PDF
      Alert.alert('Success', 'PDF report downloaded');
    } catch (error) {
      Alert.alert('Error', 'Failed to generate PDF');
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Analyzing voice sample...</Text>
      </View>
    );
  }

  if (!results) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>No results available</Text>
      </View>
    );
  }

  const riskLevel = getRiskLevel(results.risk_percentage);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.riskCard}>
        <Text style={styles.riskLabel}>Risk Assessment</Text>
        <Text style={[styles.riskScore, { color: riskLevel.color }]}>
          {results.risk_percentage.toFixed(1)}%
        </Text>
        <Text style={styles.riskLevel}>{riskLevel.label}</Text>
        <Text style={styles.confidence}>
          Confidence: {results.confidence_level.toFixed(1)}%
        </Text>
      </View>

      {results.risk_percentage > 60 && (
        <View style={styles.alertBanner}>
          <Text style={styles.alertText}>⚠️ Elevated Risk Detected</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Findings</Text>
        {results.biomarkers && Object.entries(results.biomarkers)
          .slice(0, 5)
          .map(([key, data]: [string, any]) => (
            <View key={key} style={styles.biomarkerItem}>
              <Text style={styles.biomarkerName}>
                {key.replace(/_/g, ' ').toUpperCase()}
              </Text>
              <Text style={styles.biomarkerValue}>
                {data.value} {data.unit}
              </Text>
              <Text style={[styles.biomarkerStatus, { color: getStatusColor(data.status) }]}>
                {data.status.toUpperCase()}
              </Text>
            </View>
          ))}
      </View>

      <TouchableOpacity style={styles.button} onPress={downloadPDF}>
        <Text style={styles.buttonText}>Download PDF Report</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'critical':
      return COLORS.error;
    case 'warning':
      return COLORS.warning;
    default:
      return COLORS.success;
  }
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
    padding: SPACING.lg,
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    marginTop: SPACING.md,
    color: COLORS.text.secondary,
  },
  errorText: {
    ...TYPOGRAPHY.body,
    color: COLORS.error,
  },
  riskCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: SPACING.xl,
    margin: SPACING.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  riskLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.secondary,
    marginBottom: SPACING.sm,
  },
  riskScore: {
    fontSize: 64,
    fontWeight: 'bold',
    marginBottom: SPACING.sm,
  },
  riskLevel: {
    ...TYPOGRAPHY.h3,
    marginBottom: SPACING.md,
  },
  confidence: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
  },
  alertBanner: {
    backgroundColor: COLORS.warning,
    padding: SPACING.md,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    borderRadius: 8,
  },
  alertText: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    margin: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: 12,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    marginBottom: SPACING.md,
  },
  biomarkerItem: {
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  biomarkerName: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  biomarkerValue: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.secondary,
  },
  biomarkerStatus: {
    ...TYPOGRAPHY.caption,
    marginTop: SPACING.xs,
    fontWeight: '600',
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: SPACING.md,
    margin: SPACING.lg,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ResultsScreen;

