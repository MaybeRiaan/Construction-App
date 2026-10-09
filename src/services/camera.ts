import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import type { PhotoAsset, PhotoSource } from './photo';

async function shrink(uri: string, width: number, compress: number) {
  const ref = await ImageManipulator.manipulate(uri).resize({ width }).renderAsync();
  return ref.saveAsync({ compress, format: SaveFormat.JPEG, base64: true });
}

/** Take or choose a photo. Resolves null if the user cancels; throws 'permission' if refused. */
export async function pickPhoto(source: PhotoSource): Promise<PhotoAsset | null> {
  if (source === 'camera') {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) throw new Error('permission');
  }
  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.85, exif: false };
  const res = source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
  if (res.canceled || !res.assets?.length) return null;
  const a = res.assets[0];
  const [thumb, big] = await Promise.all([shrink(a.uri, 320, 0.6), shrink(a.uri, 1024, 0.8)]);
  return {
    uri: a.uri,
    thumb: `data:image/jpeg;base64,${thumb.base64}`,
    width: a.width,
    height: a.height,
    aiBase64: big.base64,
  };
}
