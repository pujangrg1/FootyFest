import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { Text, Card, Button, Chip } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { getAllLoginLogs, getAllSignupLogs, getActivityStats } from '../../services/activityLog';

export default function ActivityLogsScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState(0); // 0: Logins, 1: Signups, 2: Stats
  const [loginLogs, setLoginLogs] = useState([]);
  const [signupLogs, setSignupLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 0) {
        const logs = await getAllLoginLogs(100);
        console.log('Loaded login logs:', logs.length, logs);
        setLoginLogs(logs);
      } else if (activeTab === 1) {
        const logs = await getAllSignupLogs(100);
        console.log('Loaded signup logs:', logs.length, logs);
        setSignupLogs(logs);
      } else {
        const statistics = await getActivityStats();
        console.log('Loaded activity stats:', statistics);
        setStats(statistics);
      }
    } catch (error) {
      console.error('Error loading activity data:', error);
      // Show error to user
      alert('Error loading activity data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return format(date, 'MMM dd, yyyy h:mm a');
    } catch (e) {
      return String(timestamp);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text variant="headlineSmall" style={styles.headerTitle}>
            Activity Logs
          </Text>
          <Button
            mode="outlined"
            onPress={loadData}
            icon="refresh"
            textColor="#4CAF50"
            style={styles.refreshButton}
            compact
          >
            Refresh
          </Button>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 0 && styles.activeTab]}
            onPress={() => setActiveTab(0)}
          >
            <Ionicons
              name="log-in"
              size={20}
              color={activeTab === 0 ? '#4CAF50' : '#ccc'}
            />
            <Text style={[styles.tabText, activeTab === 0 && styles.activeTabText]}>
              Logins ({loginLogs.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 1 && styles.activeTab]}
            onPress={() => setActiveTab(1)}
          >
            <Ionicons
              name="person-add"
              size={20}
              color={activeTab === 1 ? '#4CAF50' : '#ccc'}
            />
            <Text style={[styles.tabText, activeTab === 1 && styles.activeTabText]}>
              Signups ({signupLogs.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 2 && styles.activeTab]}
            onPress={() => setActiveTab(2)}
          >
            <Ionicons
              name="stats-chart"
              size={20}
              color={activeTab === 2 ? '#4CAF50' : '#ccc'}
            />
            <Text style={[styles.tabText, activeTab === 2 && styles.activeTabText]}>
              Statistics
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : (
            <>
              {activeTab === 0 && (
                <View>
                  {loginLogs.length === 0 ? (
                    <Card style={styles.emptyCard}>
                      <Card.Content>
                        <Text style={styles.emptyText}>No login logs found.</Text>
                      </Card.Content>
                    </Card>
                  ) : (
                    loginLogs.map((log) => (
                      <Card key={log.id} style={styles.logCard}>
                        <Card.Content>
                          <View style={styles.logHeader}>
                            <Ionicons name="log-in" size={20} color="#4CAF50" />
                            <Text style={styles.logEmail}>{log.email || 'N/A'}</Text>
                            <Chip style={styles.logChip} textStyle={styles.logChipText}>
                              Login
                            </Chip>
                          </View>
                          <Text style={styles.logTime}>
                            {formatTimestamp(log.timestamp || log.createdAt)}
                          </Text>
                          {log.metadata?.platform && (
                            <Text style={styles.logMeta}>Platform: {log.metadata.platform}</Text>
                          )}
                          {log.metadata?.method && (
                            <Text style={styles.logMeta}>Method: {log.metadata.method}</Text>
                          )}
                        </Card.Content>
                      </Card>
                    ))
                  )}
                </View>
              )}

              {activeTab === 1 && (
                <View>
                  {signupLogs.length === 0 ? (
                    <Card style={styles.emptyCard}>
                      <Card.Content>
                        <Text style={styles.emptyText}>No signup logs found.</Text>
                      </Card.Content>
                    </Card>
                  ) : (
                    signupLogs.map((log) => (
                      <Card key={log.id} style={styles.logCard}>
                        <Card.Content>
                          <View style={styles.logHeader}>
                            <Ionicons name="person-add" size={20} color="#6C63FF" />
                            <Text style={styles.logEmail}>{log.email || 'N/A'}</Text>
                            <Chip style={styles.signupChip} textStyle={styles.logChipText}>
                              Signup
                            </Chip>
                          </View>
                          <Text style={styles.logTime}>
                            {formatTimestamp(log.timestamp || log.createdAt)}
                          </Text>
                          {log.metadata?.roles && (
                            <Text style={styles.logMeta}>
                              Roles: {log.metadata.roles.join(', ')}
                            </Text>
                          )}
                          {log.metadata?.method && (
                            <Text style={styles.logMeta}>Method: {log.metadata.method}</Text>
                          )}
                          {log.metadata?.displayName && (
                            <Text style={styles.logMeta}>
                              Name: {log.metadata.displayName}
                            </Text>
                          )}
                        </Card.Content>
                      </Card>
                    ))
                  )}
                </View>
              )}

              {activeTab === 2 && stats && (
                <View>
                  <Card style={styles.statsCard}>
                    <Card.Content>
                      <Text variant="titleLarge" style={styles.statsTitle}>
                        Activity Statistics
                      </Text>
                      <View style={styles.statsRow}>
                        <Text style={styles.statsLabel}>Total Logins:</Text>
                        <Text style={styles.statsValue}>{stats.totalLogins}</Text>
                      </View>
                      <View style={styles.statsRow}>
                        <Text style={styles.statsLabel}>Total Signups:</Text>
                        <Text style={styles.statsValue}>{stats.totalSignups}</Text>
                      </View>
                      <View style={styles.statsRow}>
                        <Text style={styles.statsLabel}>Total Logouts:</Text>
                        <Text style={styles.statsValue}>{stats.totalLogouts}</Text>
                      </View>
                      <View style={styles.statsRow}>
                        <Text style={styles.statsLabel}>Unique Users:</Text>
                        <Text style={styles.statsValue}>{stats.uniqueUsers}</Text>
                      </View>
                    </Card.Content>
                  </Card>

                  {Object.keys(stats.byDate).length > 0 && (
                    <Card style={styles.statsCard}>
                      <Card.Content>
                        <Text variant="titleMedium" style={styles.statsTitle}>
                          Activity by Date
                        </Text>
                        {Object.entries(stats.byDate)
                          .sort((a, b) => b[0].localeCompare(a[0]))
                          .slice(0, 10)
                          .map(([date, data]) => (
                            <View key={date} style={styles.dateStatsRow}>
                              <Text style={styles.dateLabel}>{date}</Text>
                              <View style={styles.dateStats}>
                                <Text style={styles.dateStatText}>
                                  Logins: {data.logins}
                                </Text>
                                <Text style={styles.dateStatText}>
                                  Signups: {data.signups}
                                </Text>
                                <Text style={styles.dateStatText}>
                                  Logouts: {data.logouts}
                                </Text>
                              </View>
                            </View>
                          ))}
                      </Card.Content>
                    </Card>
                  )}
                </View>
              )}
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
    backgroundColor: '#0f0f1e',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    color: '#fff',
    fontWeight: 'bold',
    flex: 1,
  },
  refreshButton: {
    borderColor: '#4CAF50',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  activeTab: {
    backgroundColor: '#0f0f1e',
  },
  tabText: {
    color: '#ccc',
    fontSize: 12,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#4CAF50',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
  },
  emptyCard: {
    backgroundColor: '#1a1a2e',
    marginBottom: 12,
    borderRadius: 12,
    paddingVertical: 20,
  },
  emptyText: {
    color: '#ccc',
    textAlign: 'center',
    fontSize: 16,
  },
  logCard: {
    backgroundColor: '#1a1a2e',
    marginBottom: 12,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#6C63FF',
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  logEmail: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  logChip: {
    backgroundColor: '#4CAF50',
    height: 24,
  },
  signupChip: {
    backgroundColor: '#6C63FF',
    height: 24,
  },
  logChipText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  logTime: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 4,
  },
  logMeta: {
    color: '#888',
    fontSize: 11,
    marginTop: 4,
  },
  statsCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  statsTitle: {
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3e',
  },
  statsLabel: {
    color: '#aaa',
    fontSize: 14,
  },
  statsValue: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: 'bold',
  },
  dateStatsRow: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3e',
  },
  dateLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  dateStats: {
    flexDirection: 'row',
    gap: 16,
  },
  dateStatText: {
    color: '#aaa',
    fontSize: 12,
  },
});

