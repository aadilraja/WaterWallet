import React, { useEffect, useState } from 'react';
import { View, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { fetchAllocation, fetchUsage } from '../services/api';
import WaterChart from '../components/WaterChart';

const COLUMNS = [
  'kitchen_consumption_L',
  'bathroom_consumption_L',
  'garden_consumption_L',
  'other_consumption_L',
  'total_consumption_L',
];

export default function Dashboard() {
  const [allocData, setAllocData] = useState(null);
  const [usageData, setUsageData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchAllocation(), fetchUsage()])
      .then(([allocRes, usageRes]) => {
        setAllocData(allocRes.data);
        setUsageData(usageRes.data);
      })
      .catch(err => Alert.alert('Error', err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator size="large" /></View>;
  }

  // Extract series for charts
  const allocValues = COLUMNS.map(key => allocData[key]);
  const usageValues = COLUMNS.map(key => usageData[key]);
  const labels = ['Kitchen', 'Bathroom', 'Garden', 'Other', 'Total'];

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <WaterChart title="Allocated Water (L)" data={allocValues} labels={labels} />
      <WaterChart title="Used Water (L)" data={usageValues} labels={labels} />
    </ScrollView>
  );
}
