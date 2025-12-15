import React, { useState } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, Platform } from 'react-native';
import { Text, Menu, Chip } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { setSelectedRole } from '../store/slices/authSlice';
import { useNavigation } from '@react-navigation/native';

export default function RoleSwitcher() {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { roles, selectedRole } = useSelector((state) => state.auth);
  const [menuVisible, setMenuVisible] = useState(false);

  // Don't show switcher if user has only one role
  if (!roles || roles.length <= 1) {
    return null;
  }

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

  const getRoleLabel = (role) => {
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

  const handleRoleChange = (newRole) => {
    if (newRole !== selectedRole) {
      dispatch(setSelectedRole(newRole));
      setMenuVisible(false);
      // Navigation will be handled by RootNavigator based on selected role
      // The RootNavigator will automatically switch to the correct stack
      // We don't need to manually reset navigation here as RootNavigator handles it
    }
  };

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <TouchableOpacity
              onPress={() => setMenuVisible(true)}
              style={styles.switcherButton}
            >
              <Ionicons name={getRoleIcon(selectedRole)} size={20} color="#4CAF50" />
              <Text style={styles.switcherText}>{getRoleLabel(selectedRole)}</Text>
              <Ionicons name="chevron-down" size={16} color="#888" />
            </TouchableOpacity>
          }
          contentStyle={styles.menuContent}
        >
          {roles.map((role) => (
            <Menu.Item
              key={role}
              onPress={() => handleRoleChange(role)}
              title={getRoleLabel(role)}
              leadingIcon={getRoleIcon(role)}
              titleStyle={[
                styles.menuItemText,
                role === selectedRole && styles.menuItemTextSelected
              ]}
            />
          ))}
        </Menu>
      </View>
    );
  }

  // Mobile: Use modal
  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => setMenuVisible(true)}
        style={styles.switcherButton}
      >
        <Ionicons name={getRoleIcon(selectedRole)} size={20} color="#4CAF50" />
        <Text style={styles.switcherText}>{getRoleLabel(selectedRole)}</Text>
        <Ionicons name="chevron-down" size={16} color="#888" />
      </TouchableOpacity>

      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Switch Role</Text>
              <TouchableOpacity onPress={() => setMenuVisible(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            {roles.map((role) => (
              <TouchableOpacity
                key={role}
                style={[
                  styles.roleOption,
                  role === selectedRole && styles.roleOptionSelected
                ]}
                onPress={() => handleRoleChange(role)}
              >
                <View style={styles.roleOptionContent}>
                  <Ionicons
                    name={getRoleIcon(role)}
                    size={24}
                    color={role === selectedRole ? '#4CAF50' : '#888'}
                  />
                  <Text
                    style={[
                      styles.roleOptionText,
                      role === selectedRole && styles.roleOptionTextSelected
                    ]}
                  >
                    {getRoleLabel(role)}
                  </Text>
                  {role === selectedRole && (
                    <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginRight: 8,
  },
  switcherButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#4CAF50',
    gap: 6,
  },
  switcherText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
  },
  menuContent: {
    backgroundColor: '#1a1a2e',
  },
  menuItemText: {
    color: '#fff',
  },
  menuItemTextSelected: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  roleOption: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  roleOptionSelected: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  roleOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  roleOptionText: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  roleOptionTextSelected: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
});

