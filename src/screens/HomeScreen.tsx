/**
 * Home Screen
 * ===========
 * Displays list of test centers
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { HomeScreenProps } from '../types/navigation';
import { useTestCentersStore } from '../store/useTestCentersStore';

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { testCenters, isLoading, error, fetchAll } = useTestCentersStore();

  useEffect(() => {
    fetchAll();
  }, []);

  const handleRefresh = () => {
    fetchAll();
  };

  const handleTestCenterPress = (id: string, name: string) => {
    navigation.navigate('TestCenter', {
      testCenterId: id,
      testCenterName: name,
    });
  };

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>⚠️ {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchAll}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading && testCenters.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading test centers...</Text>
      </View>
    );
  }

  if (testCenters.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No test centers found</Text>
        <Text style={styles.emptySubtext}>
          Make sure the database is set up correctly
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={testCenters}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.testCenterCard}
            onPress={() => handleTestCenterPress(item.id, item.name)}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.testCenterName}>{item.name}</Text>
              <View style={styles.routeBadge}>
                <Text style={styles.routeBadgeText}>
                  {item.route_count} {item.route_count === 1 ? 'route' : 'routes'}
                </Text>
              </View>
            </View>
            {item.city && (
              <Text style={styles.testCenterCity}>📍 {item.city}</Text>
            )}
            {item.address && (
              <Text style={styles.testCenterAddress}>{item.address}</Text>
            )}
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f3f4f6',
  },
  listContent: {
    padding: 16,
  },
  testCenterCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  testCenterName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
    marginRight: 8,
  },
  routeBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  routeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
  },
  testCenterCity: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  testCenterAddress: {
    fontSize: 12,
    color: '#9ca3af',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
});
