import React from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { setSelectedRole } from '../../store/slices/authSlice';

export default function RoleSelectionScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { roles } = useSelector((state) => state.auth);

  const handleRoleSelect = (role) => {
    dispatch(setSelectedRole(role));
    // Navigation will be handled by RootNavigator based on selected role
    // The component will re-render and show the appropriate stack
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'organizer':
        return 'trophy';
      case 'team':
        return 'people';
      case 'spectator':
        return 'eye';
      case 'admin':
        return 'shield';
      default:
        return 'person';
    }
  };

  const getRoleTitle = (role) => {
    switch (role) {
      case 'organizer':
        return 'Organizer';
      case 'team':
        return 'Team';
      case 'spectator':
        return 'Spectator';
      case 'admin':
        return 'Admin';
      default:
        return role.charAt(0).toUpperCase() + role.slice(1);
    }
  };

  const getRoleDescription = (role) => {
    switch (role) {
      case 'organizer':
        return 'Create and manage tournaments';
      case 'team':
        return 'Join tournaments and manage your team';
      case 'spectator':
        return 'View tournaments and match schedules';
      case 'admin':
        return 'Manage all tournaments and users';
      default:
        return 'Access app features';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="person-circle" size={64} color="#4CAF50" />
          <Text variant="headlineMedium" style={styles.title}>
            Select Your Role
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            You have access to multiple roles. Choose which one you'd like to use now.
            You can switch roles anytime from the menu.
          </Text>
        </View>

        <View style={styles.rolesContainer}>
          {roles.map((role) => (
            <TouchableOpacity
              key={role}
              style={styles.roleCard}
              onPress={() => handleRoleSelect(role)}
            >
              <View style={styles.roleIconContainer}>
                <Ionicons name={getRoleIcon(role)} size={32} color="#4CAF50" />
              </View>
              <View style={styles.roleContent}>
                <Text style={styles.roleTitle}>{getRoleTitle(role)}</Text>
                <Text style={styles.roleDescription}>{getRoleDescription(role)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#888" />
            </TouchableOpacity>
          ))}
        </View>
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
    padding: 24,
    backgroundColor: '#0f0f1e',
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  title: {
    color: '#fff',
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: '#aaa',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  rolesContainer: {
    flex: 1,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  roleIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  roleContent: {
    flex: 1,
  },
  roleTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  roleDescription: {
    color: '#aaa',
    fontSize: 14,
  },
});

