import React from 'react';
import { Dimensions, View, Text } from 'react-native';
import { BarChart } from 'react-native-chart-kit';

export default function WaterChart({ title, data, labels }) {
  const screenWidth = Dimensions.get('window').width - 32;
  const chartData = {
    labels,
    datasets: [{ data }],
  };

  return (
    <View style={{ marginVertical: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', textAlign: 'center' }}>{title}</Text>
      <BarChart
        data={chartData}
        width={screenWidth}
        height={220}
        chartConfig={{
          backgroundGradientFrom: '#fff',
          backgroundGradientTo: '#fff',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
        }}
        style={{ borderRadius: 8, alignSelf: 'center' }}
      />
    </View>
  );
}