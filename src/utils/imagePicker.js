import { Platform, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import WebImagePicker from '../components/web/WebImagePicker';

/**
 * Platform-aware image picker utility
 * Returns a function that works on both web and mobile
 */
export const pickImage = async (options = {}) => {
  const {
    mediaTypes = ImagePicker.MediaTypeOptions.Images,
    allowsEditing = true,
    aspect = [1, 1],
    quality = 0.7,
  } = options;

  if (Platform.OS === 'web') {
    // For web, we need to return a promise that resolves when user selects
    // This is a bit tricky since WebImagePicker uses callbacks
    return new Promise((resolve) => {
      // We'll need to handle this differently - for now, return a function
      // that can be called to show the picker
      const handleResult = (result) => {
        if (result.canceled) {
          resolve({ canceled: true, assets: null });
        } else {
          resolve(result);
        }
      };

      // Return a component or trigger function
      // Actually, for web we should use the file input directly
      // Let's create a simpler approach
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.style.display = 'none';
      document.body.appendChild(input);

      input.onchange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const blobUrl = URL.createObjectURL(file);
            const img = new window.Image();
            img.onload = () => {
              resolve({
                canceled: false,
                assets: [{
                  uri: blobUrl,
                  width: img.width,
                  height: img.height,
                  type: file.type,
                  fileName: file.name,
                  fileSize: file.size,
                }],
              });
              document.body.removeChild(input);
            };
            img.src = event.target.result;
          };
          reader.readAsDataURL(file);
        } else {
          resolve({ canceled: true, assets: null });
          document.body.removeChild(input);
        }
      };

      input.click();
    });
  }

  // Mobile: use expo-image-picker
  try {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photo library to select images.');
      return { canceled: true, assets: null };
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes,
      allowsEditing,
      aspect,
      quality,
    });

    return result;
  } catch (error) {
    console.error('Error picking image:', error);
    Alert.alert('Error', 'Failed to pick image');
    return { canceled: true, assets: null, error: error.message };
  }
};

export default pickImage;


