import React, { useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Text, Platform, Alert } from 'react-native';
import { Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

/**
 * Web-compatible image picker with drag-and-drop support
 * Matches expo-image-picker API where possible
 */
export default function WebImagePicker({
  onImageSelected,
  aspect = [1, 1],
  quality = 0.7,
  allowsEditing = true,
  mediaTypes = 'images',
  style,
  ...props
}) {
  const [preview, setPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    if (!file) return false;
    
    // Check file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      Alert.alert('Invalid File Type', 'Please select a valid image file (JPEG, PNG, GIF, or WebP)');
      return false;
    }
    
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      Alert.alert('File Too Large', 'Please select an image smaller than 5MB');
      return false;
    }
    
    return true;
  };

  const processFile = (file) => {
    if (!validateFile(file)) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target.result;
      setPreview(result);
      
      // Create a blob URL for the image
      const blob = new Blob([file], { type: file.type });
      const blobUrl = URL.createObjectURL(blob);
      
      // Simulate expo-image-picker response format
      const response = {
        canceled: false,
        assets: [{
          uri: blobUrl,
          width: 0, // Will be set when image loads
          height: 0,
          type: file.type,
          fileName: file.name,
          fileSize: file.size,
        }],
      };
      
      // Load image to get dimensions
      const img = new window.Image();
      img.onload = () => {
        response.assets[0].width = img.width;
        response.assets[0].height = img.height;
        if (onImageSelected) {
          onImageSelected(response);
        }
      };
      img.src = result;
    };
    reader.onerror = () => {
      Alert.alert('Error', 'Failed to read the image file');
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRemove = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onImageSelected) {
      onImageSelected({ canceled: true, assets: null });
    }
  };

  if (Platform.OS !== 'web') {
    // Fallback for non-web platforms (shouldn't happen)
    return (
      <View style={[styles.container, style]}>
        <Text>Image picker not available on this platform</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      
      {preview ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: preview }} style={styles.preview} />
          <View style={styles.previewActions}>
            <Button
              mode="contained"
              onPress={handleClick}
              icon="image"
              style={styles.button}
            >
              Change Image
            </Button>
            <Button
              mode="outlined"
              onPress={handleRemove}
              icon="close"
              style={styles.button}
            >
              Remove
            </Button>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.dropZone, isDragging && styles.dropZoneActive]}
          onPress={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          activeOpacity={0.7}
        >
          <Ionicons name="cloud-upload-outline" size={48} color="#4CAF50" />
          <Text style={styles.dropZoneText}>
            {isDragging ? 'Drop image here' : 'Click to select or drag and drop'}
          </Text>
          <Text style={styles.dropZoneSubtext}>
            JPEG, PNG, GIF, or WebP (max 5MB)
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  dropZone: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#4CAF50',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a2e',
    minHeight: 200,
  },
  dropZoneActive: {
    borderColor: '#66BB6A',
    backgroundColor: '#2a2a3e',
  },
  dropZoneText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  dropZoneSubtext: {
    color: '#888',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  previewContainer: {
    width: '100%',
    alignItems: 'center',
  },
  preview: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#2a2a3e',
  },
  previewActions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    marginHorizontal: 4,
  },
});


