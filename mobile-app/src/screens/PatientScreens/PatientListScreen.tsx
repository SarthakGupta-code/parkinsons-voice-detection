/**
 * Patient List Screen
 * List of all patients for healthcare workers
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ApiService from '../../services/api';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';

const PatientListScreen: React.FC = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async (pageNum = 1, search = '') => {
    try {
      setLoading(true);
      const data = await ApiService.getPatients(pageNum, 20, search);
      if (pageNum === 1) {
        setPatients(data.patients || []);
      } else {
        setPatients((prev) => [...prev, ...(data.patients || [])]);
      }
      setHasMore(data.pagination?.pages > pageNum);
    } catch (error) {
      Alert.alert('Error', 'Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(1);
    loadPatients(1, query);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadPatients(nextPage, searchQuery);
    }
  };

  const renderPatient = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.patientCard}
      onPress={() => navigation.navigate('PatientDetail' as never, { patientId: item.id })}
    >
      <View style={styles.patientHeader}>
        <Text style={styles.patientName}>{item.name || 'Unknown'}</Text>
        <Text style={styles.patientAge}>{item.age} years</Text>
      </View>
      <View style={styles.patientDetails}>
        <Text style={styles.detailText}>
          📍 {item.village || 'N/A'}, {item.district || 'N/A'}
        </Text>
        <Text style={styles.detailText}>👤 {item.gender || 'N/A'}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search patients..."
          value={searchQuery}
          onChangeText={handleSearch}
          autoCapitalize="none"
        />
      </View>

      {loading && patients.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={patients}
          renderItem={renderPatient}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No patients found</Text>
            </View>
          }
          ListFooterComponent={
            loading && patients.length > 0 ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : null
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchContainer: {
    padding: SPACING.md,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInput: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: SPACING.md,
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
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  patientName: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    flex: 1,
  },
  patientAge: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
  },
  patientDetails: {
    marginTop: SPACING.xs,
  },
  detailText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
  },
  emptyState: {
    padding: SPACING.xxl,
    alignItems: 'center',
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.secondary,
  },
});

export default PatientListScreen;

