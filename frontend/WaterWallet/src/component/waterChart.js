import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';

// Consistent color palette for water-themed charts
const WATER_COLORS = [
  '#2E86C1', // Deep blue
  '#5DADE2', // Medium blue
  '#85C1E9', // Light blue
  '#D6EAF8', // Very light blue
];

const WaterChart = ({ title, data, labels, style }) => {
  const validData = data?.length
    ? data.map(v => (Number.isFinite(v) ? v : 0))
    : labels.map(() => 0);

  const chartData = {
    labels,
    datasets: [
      {
        data: validData,
        colors: WATER_COLORS.map(color => (opacity = 1) => color)
      }
    ]
  };

  const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0, // Whole numbers for water measurements
    color: (opacity = 1) => `rgba(46, 134, 193, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(74, 85, 104, ${opacity})`,
    barPercentage: 0.75,
    propsForLabels: {
      fontSize: 10,
      fontWeight: '500',
    },
    propsForBackgroundLines: {
      strokeDasharray: '', // Solid lines
      stroke: '#E2E8F0',
    },
    style: { borderRadius: 16 }
  };

  const screenWidth = Dimensions.get('window').width;
  const width = screenWidth - 40; // Slightly less padding for better use of space

  // Function to show readable values (e.g., "1.2K" instead of "1200")
  const formatValue = (value) => {
    if (value >= 1000) {
      return `${(value/1000).toFixed(1)}K`;
    }
    return value.toString();
  };

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>{title}</Text>

      {validData.every(v => v === 0) ? (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No data available</Text>
        </View>
      ) : (
        <View style={styles.chartWrapper}>
          <BarChart
            data={chartData}
            width={width}
            height={220}
            chartConfig={chartConfig}
            fromZero
            showValuesOnTopOfBars
            withInnerLines={true}
            style={styles.chart}
            yAxisLabel=""
            yAxisSuffix="L"
            formatYLabel={formatValue}
          />
        </View>
      )}

      <View style={styles.legendContainer}>
        {labels.map((lbl, i) => (
          <View key={i} style={styles.legendItem}>
            <View
              style={[styles.legendColor, { backgroundColor: WATER_COLORS[i % WATER_COLORS.length] }]}
            />
            <Text style={styles.legendText}>
              {lbl}: <Text style={styles.legendValue}>{validData[i]} L</Text>
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3748',
    textAlign: 'center',
    marginBottom: 16
  },
  chartWrapper: {
    alignItems: 'center',
    marginVertical: 10
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  noDataContainer: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7fafc',
    borderRadius: 12,
    marginVertical: 16
  },
  noDataText: {
    fontSize: 16,
    color: '#718096'
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EDF2F7'
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    marginHorizontal: 8,
    minWidth: '40%'
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6
  },
  legendText: {
    fontSize: 13,
    color: '#4A5568',
    fontWeight: '500'
  },
  legendValue: {
    fontWeight: '700'
  }
});

export default WaterChart;