import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import axios from 'axios';

// API configuration
const API_URL = 'http://192.168.1.100:5000'; // Replace with your actual Raspberry Pi IP

const SmartWaterDashboard = () => {
  // State variables
  const [waterData, setWaterData] = useState([]);
  const [totalConsumption, setTotalConsumption] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('daily'); // daily, weekly, monthly
  const [leakAlerts, setLeakAlerts] = useState([]);
  
  // Allocation data (static for now, could be fetched from backend)
  const waterAllocation = {
    kitchen: { allocated: 100, used: 65 }, // liters
    bathroom: { allocated: 150, used: 120 },
    outdoor: { allocated: 80, used: 40 },
  };

  // Fetch water data from the Flask backend
  const fetchWaterData = async () => {
    try {
      setRefreshing(true);
      const response = await axios.get(`${API_URL}/api/water-data?limit=50`);
      
      if (response.data.status === 'success') {
        setWaterData(response.data.data);
        
        // Calculate total consumption
        const total = response.data.data.reduce((sum, item) => sum + item.total_consumption, 0);
        setTotalConsumption(total);
        
        // Filter leak alerts
        const leaks = response.data.data.filter(item => item.leak_detected);
        setLeakAlerts(leaks);
      }
    } catch (error) {
      console.error('Error fetching water data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchWaterData();
    
    // Set up periodic refresh every 5 minutes
    const intervalId = setInterval(fetchWaterData, 300000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  // Prepare data for charts
  const prepareFlowRateData = () => {
    // Take the last 7 records for the chart
    const chartData = waterData.slice(0, 7).reverse();
    
    return {
      labels: chartData.map(item => {
        const date = new Date(item.timestamp);
        return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
      }),
      datasets: [
        {
          data: chartData.map(item => item.flow_rate),
          color: (opacity = 1) => `rgba(65, 105, 225, ${opacity})`,
          strokeWidth: 2,
        },
      ],
      legend: ['Flow Rate (L/min)'],
    };
  };

  const prepareConsumptionByAreaData = () => {
    return {
      labels: ['Kitchen', 'Bathroom', 'Outdoor'],
      datasets: [
        {
          data: [
            waterAllocation.kitchen.used,
            waterAllocation.bathroom.used,
            waterAllocation.outdoor.used,
          ],
        },
      ],
    };
  };

  const prepareAllocationData = () => {
    return [
      {
        name: 'Kitchen',
        used: waterAllocation.kitchen.used,
        allocated: waterAllocation.kitchen.allocated,
        color: '#FF6384',
        legendFontColor: '#7F7F7F',
        legendFontSize: 12,
      },
      {
        name: 'Bathroom',
        used: waterAllocation.bathroom.used,
        allocated: waterAllocation.bathroom.allocated,
        color: '#36A2EB',
        legendFontColor: '#7F7F7F',
        legendFontSize: 12,
      },
      {
        name: 'Outdoor',
        used: waterAllocation.outdoor.used,
        allocated: waterAllocation.outdoor.allocated,
        color: '#FFCE56',
        legendFontColor: '#7F7F7F',
        legendFontSize: 12,
      },
    ];
  };

  // Calculate efficiency percentages
  const calculateEfficiency = () => {
    const totalUsed = waterAllocation.kitchen.used + waterAllocation.bathroom.used + waterAllocation.outdoor.used;
    const totalAllocated = waterAllocation.kitchen.allocated + waterAllocation.bathroom.allocated + waterAllocation.outdoor.allocated;
    
    return Math.round((1 - (totalUsed / totalAllocated)) * 100);
  };

  // Time frame selection
  const timeframeOptions = ['daily', 'weekly', 'monthly'];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Smart Water Dashboard</Text>
        <Text style={styles.headerSubtitle}>Home Water Management System</Text>
      </View>
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchWaterData} />
        }
      >
        {/* Overall Usage Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Overall Water Usage</Text>
          <View style={styles.usageContainer}>
            <View style={styles.usageItem}>
              <Text style={styles.usageValue}>{totalConsumption.toFixed(1)}</Text>
              <Text style={styles.usageLabel}>Total Liters</Text>
            </View>
            <View style={styles.usageItem}>
              <Text style={styles.usageValue}>{calculateEfficiency()}%</Text>
              <Text style={styles.usageLabel}>Efficiency</Text>
            </View>
            <View style={styles.usageItem}>
              <Text style={styles.usageValue}>{leakAlerts.length}</Text>
              <Text style={styles.usageLabel}>Leak Alerts</Text>
            </View>
          </View>
        </View>
        
        {/* Time Frame Selector */}
        <View style={styles.timeframeSelector}>
          {timeframeOptions.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.timeframeOption,
                selectedTimeframe === option && styles.selectedTimeframe,
              ]}
              onPress={() => setSelectedTimeframe(option)}
            >
              <Text
                style={[
                  styles.timeframeText,
                  selectedTimeframe === option && styles.selectedTimeframeText,
                ]}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Flow Rate Chart */}
        {waterData.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Real-time Flow Rate</Text>
            <LineChart
              data={prepareFlowRateData()}
              width={Dimensions.get('window').width - 40}
              height={220}
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 1,
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: '6',
                  strokeWidth: '2',
                  stroke: '#4169E1',
                },
              }}
              bezier
              style={styles.chart}
            />
          </View>
        )}
        
        {/* Consumption by Area */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Consumption by Area</Text>
          <BarChart
            data={prepareConsumptionByAreaData()}
            width={Dimensions.get('window').width - 40}
            height={220}
            yAxisLabel=""
            yAxisSuffix=" L"
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(65, 105, 225, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              barPercentage: 0.7,
            }}
            style={styles.chart}
          />
        </View>
        
        {/* Allocation vs. Usage */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Water Allocation vs. Usage</Text>
          <PieChart
            data={prepareAllocationData()}
            width={Dimensions.get('window').width - 40}
            height={220}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
            accessor="used"
            backgroundColor="transparent"
            paddingLeft="15"
            style={styles.chart}
          />
        </View>
        
        {/* Area Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Area Details</Text>
          
          {/* Kitchen */}
          <View style={styles.areaItem}>
            <View style={styles.areaHeader}>
              <Text style={styles.areaName}>Kitchen</Text>
              <Text style={styles.areaUsage}>{waterAllocation.kitchen.used} / {waterAllocation.kitchen.allocated} L</Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBar, 
                  {width: `${(waterAllocation.kitchen.used / waterAllocation.kitchen.allocated) * 100}%`},
                  {backgroundColor: waterAllocation.kitchen.used > waterAllocation.kitchen.allocated ? '#FF6347' : '#4CAF50'}
                ]} 
              />
            </View>
          </View>
          
          {/* Bathroom */}
          <View style={styles.areaItem}>
            <View style={styles.areaHeader}>
              <Text style={styles.areaName}>Bathroom</Text>
              <Text style={styles.areaUsage}>{waterAllocation.bathroom.used} / {waterAllocation.bathroom.allocated} L</Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBar, 
                  {width: `${(waterAllocation.bathroom.used / waterAllocation.bathroom.allocated) * 100}%`},
                  {backgroundColor: waterAllocation.bathroom.used > waterAllocation.bathroom.allocated ? '#FF6347' : '#4CAF50'}
                ]} 
              />
            </View>
          </View>
          
          {/* Outdoor */}
          <View style={styles.areaItem}>
            <View style={styles.areaHeader}>
              <Text style={styles.areaName}>Outdoor</Text>
              <Text style={styles.areaUsage}>{waterAllocation.outdoor.used} / {waterAllocation.outdoor.allocated} L</Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBar, 
                  {width: `${(waterAllocation.outdoor.used / waterAllocation.outdoor.allocated) * 100}%`},
                  {backgroundColor: waterAllocation.outdoor.used > waterAllocation.outdoor.allocated ? '#FF6347' : '#4CAF50'}
                ]} 
              />
            </View>
          </View>
        </View>
        
        {/* Leak Alerts Section */}
        {leakAlerts.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Leak Alerts</Text>
            {leakAlerts.slice(0, 3).map((alert, index) => (
              <View key={index} style={styles.alertItem}>
                <Text style={styles.alertText}>
                  Leak detected at {new Date(alert.timestamp).toLocaleString()}
                </Text>
                <Text style={styles.alertDetails}>
                  Flow rate: {alert.flow_rate.toFixed(2)} L/min, Pressure: {alert.pipe_pressure.toFixed(2)} PSI
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#4169E1',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#f0f0f0',
    marginTop: 5,
  },
  scrollContent: {
    padding: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  usageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  usageItem: {
    alignItems: 'center',
    flex: 1,
  },
  usageValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4169E1',
  },
  usageLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 8,
  },
  timeframeSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  timeframeOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  selectedTimeframe: {
    backgroundColor: '#4169E1',
  },
  timeframeText: {
    color: '#666',
    fontWeight: '500',
  },
  selectedTimeframeText: {
    color: '#ffffff',
  },
  areaItem: {
    marginBottom: 15,
  },
  areaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  areaName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  areaUsage: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4169E1',
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  alertItem: {
    backgroundColor: '#FFF5F5',
    borderLeftWidth: 4,
    borderLeftColor: '#FF6347',
    padding: 12,
    marginBottom: 10,
    borderRadius: 4,
  },
  alertText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  alertDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});

export default SmartWaterDashboard;
