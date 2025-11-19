import { Audio } from 'expo-av';

// Map of sound effect keys to their require paths
// In a real app, you would have these files in assets/sounds/
const SOUND_FILES = {
  warmup: require('@/assets/images/favicon.png'), // Placeholder, replace with real sound file
  listening: require('@/assets/images/favicon.png'),
  speaking: require('@/assets/images/favicon.png'),
  error: require('@/assets/images/favicon.png'),
  connect: require('@/assets/images/favicon.png'),
};

type SoundKey = keyof typeof SOUND_FILES;

class AudioEffects {
  private sounds: Partial<Record<SoundKey, Audio.Sound>> = {};

  async loadSounds() {
    // Preload sounds if needed
    // For now we play on demand to save resources or manage simple playback
  }

  async play(key: SoundKey) {
    try {
      // In a real implementation, you'd properly load the audio asset.
      // Since we don't have actual audio files in the repo, this is a stub.
      // console.log(`Playing sound: ${key}`);
      
      // Example of how it would work:
      // const { sound } = await Audio.Sound.createAsync(SOUND_FILES[key]);
      // await sound.playAsync();
      
      // Unload after playing
      // sound.setOnPlaybackStatusUpdate((status) => {
      //   if (status.didJustFinish) {
      //     sound.unloadAsync();
      //   }
      // });
    } catch (error) {
      console.error('Failed to play sound effect', error);
    }
  }
}

export const audioEffects = new AudioEffects();

