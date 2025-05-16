// src/screens/DebugDashBoard.js
// This is a debug version of your Dashboard component with added logging and error handling
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Button } from 'react-native';

// Import your API services with more careful error handling
import { fetchAllocation, fetchUsage } from '../WaterWallet/src/services/api';

const DebugDashBoard = () => {
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allocation, setAllocation] = useState(null);
  const [usage, setUsage] = useState(null);
  const [logs, setLogs] = useState([]);

  // Helper function to add logs
  const addLog = (message) => {
    setLogs(prevLogs => [...prevLogs, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Separate the data fetching into a safe function
  const loadData = async () => {
    try {
      addLog('Starting to fetch allocation data');
      const allocationData = await fetchAllocation();
      addLog('Allocation data fetched successfully');
      setAllocation(allocationData.data);
      
      addLog('Starting to fetch usage data');
      const usageData = await fetchUsage();
      addLog('Usage data fetched successfully');
      setUsage(usageData.data);
      
      setIsLoading(false);
    } catch (err) {
      addLog(`Error loading data: ${err.message}`);
      setError(err.message);
      setIsLoading(false);
    }
  };

  // Use a separate function for the initial load
  useEffect(() => {
    addLog('Dashboard component mounted');
    
    // Delay data fetching to ensure UI renders first
    const timer = setTimeout(() => {
      loadData();
    }, 1000);
    
    return () => {
      clearTimeout(timer);
      addLog('Dashboard component will unmount');
    };
  }, []);

  // Manual refresh function for debugging
  const handleRefresh = () => {
    addLog('Manual refresh requested');
    setIsLoading(true);
    setError(null);
    loadData();
  };

  if (error) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.errorSection}>
          <Text style={styles.sectionTitle}>Error Loading Dashboard</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Button title="Try Again" onPress={handleRefresh} />
        </View>
        
        <View style={styles.logSection}>
          <Text style={styles.sectionTitle}>Debug Logs</Text>
          {logs.map((log, index) => (
            <Text key={index} style={styles.logText}>{log}</Text>
          ))}
        </View>
      </ScrollView>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading dashboard data...</Text>
        <View style={styles.logSection}>
          <Text style={styles.sectionTitle}>Debug Logs</Text>
          {logs.map((log, index) => (
            <Text key={index} style={styles.logText}>{log}</Text>
          ))}
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Water Allocation</Text>
        {allocation && (
          <>
            <Text>Kitchen: {allocation.kitchen}L</Text>
            <Text>Bathroom: {allocation.bathroom}L</Text>
            <Text>Garden: {allocation.garden}L</Text>
            <Text>Outdoor: {allocation.outdoor}L</Text>
            <Text style={styles.totalText}>Total: {allocation.total}L</Text>
          </>
        )}
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Water Usage</Text>
        {usage && (
          <>
            <Text>Kitchen: {usage.kitchen}L</Text>
            <Text>Bathroom: {usage.bathroom}L</Text>
            <Text>Garden: {usage.garden}L</Text>
            <Text>Outdoor: {usage.outdoor}L</Text>
            <Text style={styles.totalText}>Total: {usage.total}L</Text>
          </>
        )}
      </View>
      
      <Button title="Refresh Data" onPress={handleRefresh} />
      
      <View style={styles.logSection}>
        <Text style={styles.sectionTitle}>Debug Logs</Text>
        {logs.map((log, index) => (
          <Text key={index} style={styles.logText}>{log}</Text>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  totalText: {
    fontWeight: 'bold',
    marginTop: 8,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
  },
  errorSection: {
    backgroundColor: '#ffdddd',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: 'red',
    marginBottom: 16,
  },
  logSection: {
    backgroundColor: '#e6f7ff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  logText: {
    fontFamily: 'monospace',
    fontSize: 12,
    marginBottom: 2,
  },
});

export default DebugDashBoard;