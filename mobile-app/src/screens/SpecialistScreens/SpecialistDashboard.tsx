/**
 * Specialist Dashboard
 * Dashboard for neurologists/specialists
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
import { useNavigation } from '@react-navigation/native';
import ApiService from '../../services/api';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';

const SpecialistDashboard: React.FC = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPatients: 0,
    highRiskQueue: 0,
    pendingReviews: 0,
    confirmedCases: 0,
  });
  const [highRiskPatients, setHighRiskPatients] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // In production, this would filter by risk level
      const patientsData = await ApiService.getPatients(1, 20);
      setHighRiskPatients(patientsData.patients?.slice(0, 5) || []);
      setStats({
        totalPatients: patientsData.pagination?.total || 0,
        highRiskQueue: 0, // Would filter by risk > 60
        pendingReviews: 0, // Would filter by status
        confirmedCases: 0, // Would filter by confirmed diagnosis
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
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
        <Text style={styles.headerTitle}>Specialist Dashboard</Text>
        <Text style={styles.headerSubtitle}>Risk-prioritized patient queue</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, styles.urgentCard]}>
          <Text style={[styles.statNumber, { color: COLORS.error }]}>
            {stats.highRiskQueue}
          </Text>
          <Text style={styles.statLabel}>High Risk</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.pendingReviews}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalPatients}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.confirmedCases}</Text>
          <Text style={styles.statLabel}>Confirmed</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>High Priority Cases</Text>
        {highRiskPatients.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No high-risk cases</Text>
          </View>
        ) : (
          highRiskPatients.map((patient) => (
            <TouchableOpacity
              key={patient.id}
              style={styles.patientCard}
              onPress={() =>
                navigation.navigate('PatientDetail' as never, { patientId: patient.id })
              }
            >
              <View style={styles.patientHeader}>
                <View>
                  <Text style={styles.patientName}>{patient.name || 'Unknown'}</Text>
                  <Text style={styles.patientDetails}>
                    Age: {patient.age} • {patient.village || 'N/A'}
                  </Text>
                </View>
                <View style={styles.riskIndicator}>
                  <Text style={styles.riskPercentage}>85%</Text>
                  <Text style={styles.riskLabel}>Risk</Text>
                </View>
              </View>
              <View style={styles.patientFooter}>
                <Text style={styles.lastTest}>
                  Last test: 2 days ago
                </Text>
                <Text style={styles.arrow}>→</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('PatientList' as never)}
        >
          <Text style={styles.actionButtonText}>📋 View All Patients</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Reports' as never)}
        >
          <Text style={styles.actionButtonText}>📊 Generate Reports</Text>
        </TouchableOpacity>
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
  headerTitle: {
    ...TYPOGRAPHY.h2,
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: SPACING.md,
    gap: SPACING.md,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  urgentCard: {
    borderColor: COLORS.error,
    borderWidth: 2,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    textAlign: 'center',
  },
  section: {
    padding: SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    marginBottom: SPACING.md,
  },
  emptyState: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.secondary,
  },
  patientCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#eee',
  },
  patientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  patientName: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  patientDetails: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
  },
  riskIndicator: {
    alignItems: 'center',
    backgroundColor: COLORS.error + '20',
    padding: SPACING.sm,
    borderRadius: 8,
    minWidth: 60,
  },
  riskPercentage: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.error,
  },
  riskLabel: {
    ...TYPOGRAPHY.caption,
    fontSize: 10,
    color: COLORS.error,
  },
  patientFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  lastTest: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
  },
  arrow: {
    fontSize: 20,
    color: COLORS.text.secondary,
  },
  quickActions: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  actionButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  actionButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default SpecialistDashboard;

