import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { PieChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import axios from 'axios';

// API configuration
const API_URL = 'http://192.168.1.100:5000'; // Replace with your actual Raspberry Pi IP

const WaterAllocationScreen = () => {
  // State for water allocation
  const [allocations, setAllocations] = useState({
    kitchen: { allocated: 100, used: 65 },
    bathroom: { allocated: 150, used: 120 },
    outdoor: { allocated: 80, used: 40 },
  });
  
  const [editMode, setEditMode] = useState(false);
  const [tempAllocations, setTempAllocations] = useState({});
  const [totalAllocated, setTotalAllocated] = useState(0);
  
  // Calculate total allocation on component mount
  useEffect(() => {
    const total = Object.values(allocations).reduce(
      (sum, area) => sum + area.allocated, 0
    );
    setTotalAllocated(total);
  }, []);
  
  // Enter edit mode
  const handleEditPress = () => {
    setTempAllocations({
      kitchen: { ...allocations.kitchen },
      bathroom: { ...allocations.bathroom },
      outdoor: { ...allocations.outdoor },
    });
    setEditMode(true);
  };
  
  // Save allocations
  const handleSavePress = async () => {
    try {
      // await axios.post(`${API_URL}/api/update-allocations`, tempAllocations);
      setAllocations({ ...tempAllocations });
      const total = Object.values(tempAllocations).reduce(
        (sum, area) => sum + area.allocated, 0
      );
      setTotalAllocated(total);
      setEditMode(false);
      Alert.alert("Success", "Water allocations updated successfully!", [{ text: "OK" }]);
    } catch (error) {
      console.error('Error updating allocations:', error);
      Alert.alert("Error", "Failed to update water allocations. Please try again.", [{ text: "OK" }]);
    }
  };
  
  // Cancel edit
  const handleCancelPress = () => {
    setEditMode(false);
  };
  
  // Update a specific allocation
  const handleAllocationChange = (area, value) => {
    setTempAllocations({
      ...tempAllocations,
      [area]: {
        ...tempAllocations[area],
        allocated: value,
      },
    });
  };
  
  // Prepare data for the pie chart
  const prepareAllocationData = () => {
    return [
      { name: 'Kitchen', allocation: allocations.kitchen.allocated, color: '#FF6384', legendFontColor: '#7F7F7F', legendFontSize: 12 },
      { name: 'Bathroom', allocation: allocations.bathroom.allocated, color: '#36A2EB', legendFontColor: '#7F7F7F', legendFontSize: 12 },
      { name: 'Outdoor', allocation: allocations.outdoor.allocated, color: '#FFCE56', legendFontColor: '#7F7F7F', legendFontSize: 12 },
    ];
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Water Allocation</Text>
        <Text style={styles.headerSubtitle}>Set Water Limits for Each Area</Text>
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Total Allocation Info */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Current Allocation</Text>
            {!editMode && (
              <TouchableOpacity style={styles.editButton} onPress={handleEditPress}>
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <Text style={styles.totalAllocation}>
            Total: {totalAllocated} Liters
          </Text>
          
          <PieChart
            data={prepareAllocationData()}
            width={Dimensions.get('window').width - 40}
            height={200}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
            accessor="allocation"
            backgroundColor="transparent"
            paddingLeft="15"
            style={styles.chart}
          />
        </View>
        
        {/* Allocation Controls */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {editMode ? 'Edit Allocations' : 'Area Allocations'}
          </Text>
          
          {/* Kitchen & Bathroom sections unchanged... */}
          
          {/* Outdoor Allocation */}
          <View style={styles.allocationItem}>
            <View style={styles.allocationHeader}>
              <Text style={styles.areaName}>Outdoor</Text>
              <Text style={styles.allocation}>
                {editMode 
                  ? `${tempAllocations.outdoor.allocated} L` 
                  : `${allocations.outdoor.allocated} L`}
              </Text>
            </View>
            
            {editMode ? (
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={200}
                step={5}
                value={tempAllocations.outdoor.allocated}
                onValueChange={(value) => handleAllocationChange('outdoor', value)}
                minimumTrackTintColor="#FFCE56"
                maximumTrackTintColor="#d3d3d3"
                thumbTintColor="#FFCE56"
              />
            ) : (
              <View style={styles.usageInfo}>
                <Text style={styles.usageText}>
                  Used: {allocations.outdoor.used} L ({Math.round((allocations.outdoor.used / allocations.outdoor.allocated) * 100)}%)
                </Text>
                <View style={styles.progressBarContainer}>
                  <View 
                    style={[
                      styles.progressBar, 
                      { width: `${(allocations.outdoor.used / allocations.outdoor.allocated) * 100}%` },
                      { backgroundColor: '#FFCE56' }
                    ]} 
                  />
                </View>
              </View>
            )}
          </View>
          
          {/* Action Buttons */}
          {editMode && (
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancelPress}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSavePress}>
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  /* existing styles... */
  allocationItem: {
    marginVertical: 10,
  },
  allocationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  usageInfo: {
    marginTop: 5,
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: '#F44336',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default WaterAllocationScreen;
