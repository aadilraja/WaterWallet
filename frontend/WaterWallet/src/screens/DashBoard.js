import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { fetchAllocation, fetchUsage } from '../services/api';
import WaterChart from '../component/waterChart';
import { Ionicons } from '@expo/vector-icons';
import './DashBoard.css';

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
      if (showFullLoading) setLoading(true);
      setError(null);
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
        "We couldn't load your water data. Please try again.",
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

  useEffect(() => { loadData(); }, [loadData]);

  const labels = CATEGORIES.map(cat => cat.label);
  const allocValues = allocData ? CATEGORIES.map(cat => allocData[cat.key] || 0) : Array(CATEGORIES.length).fill(0);
  const usageValues = usageData ? CATEGORIES.map(cat => usageData[cat.key] || 0) : Array(CATEGORIES.length).fill(0);

  const totalAllocated = allocData?.total || 0;
  const totalUsed = usageData?.total || 0;
  const efficiency = totalAllocated > 0 ? Math.round((totalUsed / totalAllocated) * 100) : 0;
  const savedWater = totalAllocated - totalUsed;
  const savingPercentage = totalAllocated > 0 ? Math.round((savedWater / totalAllocated) * 100) : 0;

  if (loading) {
    return (
      <SafeAreaView className="safeArea">
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View className="centered">
          <ActivityIndicator size="large" color="#2E86C1" />
          <Text className="loadingText">Loading your water data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="safeArea">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View className="header">
        <Text className="headerTitle">Water Dashboard</Text>
        <TouchableOpacity
          className="refreshButton"
          onPress={() => loadData()}
          disabled={loading || refreshing}
        >
          <Ionicons name="refresh" size={22} color="#2E86C1" />
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#2E86C1"]} tintColor="#2E86C1" />
          }
          className="scrollContainer"
        >
          {error ? (
            <View className="errorCard">
              <Ionicons name="alert-circle-outline" size={40} color="#E53E3E" />
              <Text className="errorText">{error}</Text>
              <TouchableOpacity className="retryButton" onPress={() => loadData()}>
                <Text className="retryButtonText">Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View className="metricsContainer">
                <View className="metricCard">
                  <Text className="metricValue">{totalAllocated}</Text>
                  <Text className="metricLabel">Allocated (L)</Text>
                </View>
                <View className="metricCard">
                  <Text className="metricValue">{totalUsed}</Text>
                  <Text className="metricLabel">Used (L)</Text>
                </View>
                <View className="metricCard">
                  <Text className="metricValue" style={{ color: efficiency > 80 ? '#38A169' : efficiency > 50 ? '#DD6B20' : '#E53E3E' }}>{efficiency}%</Text>
                  <Text className="metricLabel">Efficiency</Text>
                </View>
              </View>

              <View className="savingsCard">
                <View className="savingsHeader">
                  <Ionicons name="water-outline" size={22} color={savedWater > 0 ? "#2E86C1" : "#718096"} />
                  <Text className="savingsTitle">Water Savings</Text>
                </View>
                <View className="savingsContent">
                  <Text className="savingsValue">
                    {savedWater > 0 ? `${savedWater} L (${savingPercentage}%)` : 'No savings yet'}
                  </Text>
                  <Text className="savingsTip">
                    {savedWater > 0 ? "Great job! You're using less water than allocated." : "Tip: Try to use less water than allocated to see savings."}
                  </Text>
                </View>
              </View>

              <WaterChart title="Allocated Water" data={allocValues} labels={labels} className="chartCard" />
              <WaterChart title="Used Water" data={usageValues} labels={labels} className="chartCard" />

              <View className="usageBreakdownCard">
                <Text className="usageBreakdownTitle">Usage Breakdown</Text>
                {CATEGORIES.map((category) => {
                  const allocated = allocData?.[category.key] || 0;
                  const used = usageData?.[category.key] || 0;
                  const usagePercent = allocated > 0 ? (used / allocated) * 100 : 0;
                  return (
                    <View key={category.key} className="categoryRow">
                      <View className="categoryInfo">
                        <Text className="categoryName">{category.label}</Text>
                        <Text className="categoryValues">{used} / {allocated} L</Text>
                      </View>
                      <View className="progressContainer">
                        <View className="progressBar" style={{ width: `${Math.min(100, usagePercent)}%`, backgroundColor: usagePercent > 100 ? '#E53E3E' : usagePercent > 80 ? '#DD6B20' : '#2E86C1' }} />
                      </View>
                    </View>
                  );
                })}
              </View>

              <View className="tipCard">
                <Text className="tipTitle">Water Saving Tip</Text>
                <Text className="tipText">
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
