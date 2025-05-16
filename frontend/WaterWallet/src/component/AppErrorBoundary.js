// src/components/AppErrorBoundary.js
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null,
      logs: []
    };
    
    // Override console.log for debug purposes
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    
    console.log = (...args) => {
      this.setState(prevState => ({
        logs: [...prevState.logs, `LOG: ${args.map(a => 
          typeof a === 'object' ? JSON.stringify(a) : a).join(' ')}`]
      }));
      originalLog(...args);
    };
    
    console.error = (...args) => {
      this.setState(prevState => ({
        logs: [...prevState.logs, `ERROR: ${args.map(a => 
          typeof a === 'object' ? JSON.stringify(a) : a).join(' ')}`]
      }));
      originalError(...args);
    };
    
    console.warn = (...args) => {
      this.setState(prevState => ({
        logs: [...prevState.logs, `WARN: ${args.map(a => 
          typeof a === 'object' ? JSON.stringify(a) : a).join(' ')}`]
      }));
      originalWarn(...args);
    };
    
    console.log('AppErrorBoundary initialized');
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Catch errors in any components below and re-render with error message
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    console.error("React error boundary caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <ScrollView style={styles.container}>
          <View style={styles.errorBox}>
            <Text style={styles.header}>App Error</Text>
            <Text style={styles.errorText}>{this.state.error && this.state.error.toString()}</Text>
            <Text style={styles.errorText}>
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </Text>
          </View>
          
          <View style={styles.logBox}>
            <Text style={styles.header}>Debug Logs</Text>
            {this.state.logs.map((log, index) => (
              <Text key={index} style={styles.logText}>{log}</Text>
            ))}
          </View>
        </ScrollView>
      );
    }
    
    // Normally, just render children
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 10,
  },
  errorBox: {
    backgroundColor: '#ffe6e6',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  logBox: {
    backgroundColor: '#e6f7ff',
    padding: 10,
    borderRadius: 5,
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  errorText: {
    color: 'red',
    marginBottom: 5,
  },
  logText: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 2,
  },
});

export default AppErrorBoundary;