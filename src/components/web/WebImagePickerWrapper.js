import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import WebImagePicker from './WebImagePicker';

/**
 * Platform-aware ImagePicker wrapper
 * Uses expo-image-picker on mobile, WebImagePicker on web
 */
export default function WebImagePickerWrapper({
  onImageSelected,
  aspect = [1, 1],
  quality = 0.7,
  allowsEditing = true,
  mediaTypes = 'images',
  style,
  ...props
}) {
  const handleMobileImagePick = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        if (onImageSelected) {
          onImageSelected({
            canceled: true,
            error: 'Permission denied',
          });
        }
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing,
        aspect,
        quality,
      });

      if (onImageSelected) {
        onImageSelected(result);
      }
    } catch (error) {
      if (onImageSelected) {
        onImageSelected({
          canceled: true,
          error: error.message,
        });
      }
    }
  };

  if (Platform.OS === 'web') {
    return (
      <WebImagePicker
        onImageSelected={onImageSelected}
        aspect={aspect}
        quality={quality}
        allowsEditing={allowsEditing}
        mediaTypes={mediaTypes}
        style={style}
        {...props}
      />
    );
  }

  // For mobile, render a button that triggers the native picker
  return (
    <View style={style}>
      <Button
        mode="contained"
        onPress={handleMobileImagePick}
        icon="image"
        {...props}
      >
        Select Image
      </Button>
    </View>
  );
}
