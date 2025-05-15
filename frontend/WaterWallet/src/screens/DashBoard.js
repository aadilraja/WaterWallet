import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  ActivityIndicator,
  Alert,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { fetchAllocation, fetchUsage } from '../services/api';
import WaterChart from '../component/waterChart';
import WaterJar from '../component/waterjar'; // Import the new WaterJar component
import { Ionicons } from '@expo/vector-icons'; // Assuming you're using Expo

const CATEGORIES = [
  { key: 'kitchen', label: 'Kitchen' },
  { key: 'bathroom', label: 'Bathroom' },
  { key: 'garden', label: 'Garden' },
  { key: 'outdoor', label: 'Outdoor' }
];

export default function Dashboard() {
  const [allocData, setAllocData] = useState(null);
  const [usageData, setUsageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadData = useCallback(async (showFullLoading = true) => {
    try {
      if (showFullLoading) {
        setLoading(true);
      }
      setError(null);
      
      // Fetch data in parallel for better performance
      const [allocResponse, usageResponse] = await Promise.all([
        fetchAllocation(),
        fetchUsage()
      ]);
      
      setAllocData(allocResponse.data);
      setUsageData(usageResponse.data);
    } catch (err) {
      console.error('Dashboard data loading error:', err);
      setError(err.message || 'Failed to load dashboard data');
      Alert.alert(
        'Error Loading Data',
        'We couldn\'t load your water data. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData(false);
  }, [loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Extract chart data
  const labels = CATEGORIES.map(cat => cat.label);
  const allocValues = allocData 
    ? CATEGORIES.map(cat => allocData[cat.key] || 0) 
    : Array(CATEGORIES.length).fill(0);
  const usageValues = usageData 
    ? CATEGORIES.map(cat => usageData[cat.key] || 0) 
    : Array(CATEGORIES.length).fill(0);

  // Calculate water metrics
  const totalAllocated = allocData?.total || 0;
  const totalUsed = usageData?.total || 0;
  const efficiency = totalAllocated > 0 
    ? Math.round((totalUsed / totalAllocated) * 100) 
    : 0;
  const savedWater = totalAllocated - totalUsed;
  const savingPercentage = totalAllocated > 0 
    ? Math.round((savedWater / totalAllocated) * 100) 
    : 0;

  // Usage percentage for WaterJar component
  const usagePercentage = totalAllocated > 0 
    ? Math.round((totalUsed / totalAllocated) * 100) 
    : 0;

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2E86C1" />
          <Text style={styles.loadingText}>Loading your water data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Water Dashboard</Text>
        <TouchableOpacity 
          style={styles.refreshButton} 
          onPress={() => loadData()}
          disabled={loading || refreshing}
        >
          <Ionicons name="refresh" size={22} color="#2E86C1" />
        </TouchableOpacity>
      </View>

      {/* Fixed scrolling issue by making ScrollView take remaining space */}
      <View style={{flex:1}}>
        <ScrollView 
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#2E86C1']}
              tintColor="#2E86C1"
            />
          }
        >
          {error ? (
            <View style={styles.errorCard}>
              <Ionicons name="alert-circle-outline" size={40} color="#E53E3E" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity 
                style={styles.retryButton} 
                onPress={() => loadData()}
              >
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Water Jar visualization */}
              <View style={styles.waterJarCard}>
                <WaterJar 
                  percentage={usagePercentage} 
                  title="Water Usage" 
                />
                <Text style={styles.waterJarLabel}>
                  {usagePercentage <= 80 ? "Good Usage" : 
                   usagePercentage <= 100 ? "Approaching Limit" : "Exceeding Limit"}
                </Text>
              </View>

              <View style={styles.metricsContainer}>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>{totalAllocated}</Text>
                  <Text style={styles.metricLabel}>Allocated (L)</Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>{totalUsed}</Text>
                  <Text style={styles.metricLabel}>Used (L)</Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={[
                    styles.metricValue, 
                    {color: efficiency > 80 ? '#38A169' : efficiency > 50 ? '#DD6B20' : '#E53E3E'}
                  ]}>
                    {efficiency}%
                  </Text>
                  <Text style={styles.metricLabel}>Efficiency</Text>
                </View>
              </View>

              <View style={styles.savingsCard}>
                <View style={styles.savingsHeader}>
                  <Ionicons 
                    name="water-outline" 
                    size={22} 
                    color={savedWater > 0 ? "#2E86C1" : "#718096"} 
                  />
                  <Text style={styles.savingsTitle}>Water Savings</Text>
                </View>
                <View style={styles.savingsContent}>
                  <Text style={styles.savingsValue}>
                    {savedWater > 0 ? `${savedWater} L (${savingPercentage}%)` : 'No savings yet'}
                  </Text>
                  <Text style={styles.savingsTip}>
                    {savedWater > 0 
                      ? 'Great job! You\'re using less water than allocated.'
                      : 'Tip: Try to use less water than allocated to see savings.'}
                  </Text>
                </View>
              </View>
              
              <WaterChart 
                title="Allocated Water" 
                data={allocValues} 
                labels={labels} 
                style={styles.chartCard}
              />
              
              <WaterChart 
                title="Used Water" 
                data={usageValues} 
                labels={labels} 
                style={styles.chartCard}
              />
              
              <View style={styles.usageBreakdownCard}>
                <Text style={styles.usageBreakdownTitle}>Usage Breakdown</Text>
                
                {CATEGORIES.map((category, index) => {
                  const allocated = allocData?.[category.key] || 0;
                  const used = usageData?.[category.key] || 0;
                  const usagePercent = allocated > 0 ? (used / allocated) * 100 : 0;
                  
                  return (
                    <View key={category.key} style={styles.categoryRow}>
                      <View style={styles.categoryInfo}>
                        <Text style={styles.categoryName}>{category.label}</Text>
                        <Text style={styles.categoryValues}>
                          {used} / {allocated} L
                        </Text>
                      </View>
                      <View style={styles.progressContainer}>
                        <View 
                          style={[
                            styles.progressBar, 
                            { 
                              width: `${Math.min(100, usagePercent)}%`,
                              backgroundColor: 
                                usagePercent > 100 ? '#E53E3E' : 
                                usagePercent > 80 ? '#DD6B20' : '#2E86C1'
                            }
                          ]} 
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
              
              <View style={styles.tipCard}>
                <Text style={styles.tipTitle}>Water Saving Tip</Text>
                <Text style={styles.tipText}>
                  Fix leaky faucets promptly. A dripping faucet can waste up to 3,000 gallons of water per year.
                </Text>
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7FAFC'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2D3748',
  },
  refreshButton: {
    padding: 8,
  },
  // New container to fix scrolling issue - this ensures ScrollView takes remaining space
  scrollContainer: {
    flex: 1,
  },
  // Content container inside ScrollView
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff'
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#718096',
    fontWeight: '500'
  },
  // Add a new card for the water jar
  waterJarCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  waterJarLabel: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#4A5568',
  },
  errorCard: {
    backgroundColor: '#FFF5F5',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginVertical: 16,
    borderWidth: 1,
    borderColor: '#FED7D7',
  },
  errorText: {
    fontSize: 16,
    color: '#C53030',
    textAlign: 'center',
    marginVertical: 16,
  },
  retryButton: {
    backgroundColor: '#E53E3E',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D3748',
  },
  metricLabel: {
    fontSize: 12,
    color: '#718096',
    marginTop: 4,
  },
  savingsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  savingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  savingsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginLeft: 8,
  },
  savingsContent: {
    marginLeft: 30,
  },
  savingsValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3748',
  },
  savingsTip: {
    fontSize: 13,
    color: '#718096',
    marginTop: 4,
  },
  chartCard: {
    marginBottom: 16,
  },
  usageBreakdownCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  usageBreakdownTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 16,
  },
  categoryRow: {
    marginBottom: 16,
  },
  categoryInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A5568',
  },
  categoryValues: {
    fontSize: 14,
    color: '#718096',
  },
  progressContainer: {
    height: 8,
    backgroundColor: '#EDF2F7',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  tipCard: {
    backgroundColor: '#EBF8FF',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2E86C1',
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C5282',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#2A4365',
    lineHeight: 20,
  },
});