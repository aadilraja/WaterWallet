import React, { useEffect, useState } from 'react';
import { View, ScrollView, ActivityIndicator, Alert, Text, StyleSheet } from 'react-native';
import { fetchAllocation, fetchUsage } from '../services/api';
import WaterChart from '../component/waterChart';

const COLUMNS = [
  'kitchen',
  'bathroom',
  'garden',
  'outdoor'
];

export default function DashBoard() {
  const [allocData, setAllocData] = useState(null);
  const [usageData, setUsageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch data sequentially to better handle errors
      const allocResponse = await fetchAllocation();
      const usageResponse = await fetchUsage();
      
      setAllocData(allocResponse.data);
      setUsageData(usageResponse.data);
    } catch (err) {
      console.error('Dashboard data loading error:', err);
      setError(err.message || 'Failed to load dashboard data');
      Alert.alert('Error', err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading water management data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <Text style={styles.retryText} onPress={loadData}>Tap to retry</Text>
      </View>
    );
  }

  // Extract series for charts - ensure both data objects exist
  const allocValues = allocData ? COLUMNS.map(key => allocData[key] || 0) : [0, 0, 0, 0];
  const usageValues = usageData ? COLUMNS.map(key => usageData[key] || 0) : [0, 0, 0, 0];
  
  // Add total to values for display if not already included in COLUMNS
  const labels = ['Kitchen', 'Bathroom', 'Garden', 'Outdoor'];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Water Management Dashboard</Text>
      
      <View style={styles.chartContainer}>
        <WaterChart 
          title="Allocated Water (L)" 
          data={allocValues} 
          labels={labels} 
        />
      </View>
      
      <View style={styles.chartContainer}>
        <WaterChart 
          title="Used Water (L)" 
          data={usageValues} 
          labels={labels} 
        />
      </View>
      
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryHeader}>Water Summary</Text>
        <Text style={styles.summaryText}>
          Total Allocated: {allocData?.total || 0} L
        </Text>
        <Text style={styles.summaryText}>
          Total Used: {usageData?.total || 0} L
        </Text>
        <Text style={styles.summaryText}>
          Efficiency: {allocData?.total && usageData?.total 
            ? Math.round((usageData.total / allocData.total) * 100) 
            : 0}%
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 32
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666'
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginBottom: 10
  },
  retryText: {
    fontSize: 16,
    color: 'blue',
    textDecorationLine: 'underline'
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center'
  },
  chartContainer: {
    marginBottom: 24,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  summaryContainer: {
    backgroundColor: '#e9f7ef',
    borderRadius: 8,
    padding: 16
  },
  summaryHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8
  },
  summaryText: {
    fontSize: 16,
    marginBottom: 4
  }
});