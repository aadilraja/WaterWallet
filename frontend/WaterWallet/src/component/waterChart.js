import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';

const WaterChart = ({ title, data, labels }) => {
  const validData = data?.length
    ? data.map(v => (Number.isFinite(v) ? v : 0))
    : labels.map(() => 0);

  // Generate one color-per-bar
  const barColors = labels.map(
    () =>
      `rgba(${Math.floor(Math.random() * 155) + 100}, ${
        Math.floor(Math.random() * 155) + 100
      }, ${Math.floor(Math.random() * 155) + 100}, 0.8)`
  );

  const chartData = {
    labels,
    datasets: [
      {
        data: validData,
        // Wrap each color string in a function
        colors: barColors.map(color => (opacity = 1, index) => color)
      }
    ]
  };

  const chartConfig = {
    backgroundGradientFrom: '#fff',
    backgroundGradientTo: '#fff',
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(0, 118, 189, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    barPercentage: 0.7,
    style: { borderRadius: 16 }
  };

  const width = Dimensions.get('window').width - 32;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>

      {validData.every(v => v === 0) ? (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No data available</Text>
        </View>
      ) : (
        <BarChart
          data={chartData}
          width={width}
          height={220}
          chartConfig={chartConfig}
          fromZero
          showValuesOnTopOfBars
          style={styles.chart}
        />
      )}

      <View style={styles.legendContainer}>
        {labels.map((lbl, i) => (
          <View key={i} style={styles.legendItem}>
            <View
              style={[styles.legendColor, { backgroundColor: barColors[i] }]}
            />
            <Text style={styles.legendText}>
              {lbl}: {validData[i].toFixed(1)} L
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 20 },
  title: { fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  chart: { marginVertical: 8, borderRadius: 16 },
  noDataContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 16
  },
  noDataText: { fontSize: 16, color: '#666' },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginTop: 10
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', margin: 4 },
  legendColor: { width: 12, height: 12, borderRadius: 6, marginRight: 4 },
  legendText: { fontSize: 12 }
});

export default WaterChart;
