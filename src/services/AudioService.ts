import { Audio, AVPlaybackStatus } from "expo-av";

export type AmbientSoundType = "none" | "rain" | "forest" | "cafe" | "ocean" | "fireplace";
export type AlarmSoundType = "bell" | "chime" | "digital" | "gentle" | "none";

// Ambient sound URLs
const AMBIENT_SOUNDS: Record<AmbientSoundType, string | null> = {
  none: null,
  rain: "https://assets.mixkit.co/active_storage/sfx/212/212-preview.mp3",
  forest: "https://assets.mixkit.co/active_storage/sfx/1164/1164-preview.mp3",
  cafe: "https://assets.mixkit.co/active_storage/sfx/2174/2174-preview.mp3",
  ocean: "https://assets.mixkit.co/active_storage/sfx/2195/2195-preview.mp3",
  fireplace: "https://assets.mixkit.co/active_storage/sfx/2177/2177-preview.mp3",
};

// Alarm sound URLs
const ALARM_SOUNDS: Record<AlarmSoundType, string | null> = {
  none: null,
  bell: "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3",
  chime: "https://assets.mixkit.co/active_storage/sfx/2870/2870-preview.mp3",
  digital: "https://assets.mixkit.co/active_storage/sfx/2867/2867-preview.mp3",
  gentle: "https://assets.mixkit.co/active_storage/sfx/2868/2868-preview.mp3",
};

class AudioService {
  private ambientSound: Audio.Sound | null = null;
  private alarmSound: Audio.Sound | null = null;
  private isAmbientPlaying = false;
  private currentAmbientType: AmbientSoundType = "none";
  private ambientVolume = 0.5;

  async initialize() {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });
    } catch (error) {
      console.error("Error initializing audio:", error);
    }
  }

  // Ambient Sound Methods
  async playAmbientSound(type: AmbientSoundType, volume: number = 0.5): Promise<boolean> {
    const soundUrl = AMBIENT_SOUNDS[type];
    if (!soundUrl || type === "none") {
      await this.stopAmbientSound();
      return false;
    }

    try {
      // Stop existing sound first
      await this.stopAmbientSound();

      const { sound } = await Audio.Sound.createAsync(
        { uri: soundUrl },
        {
          isLooping: true,
          volume: volume,
          shouldPlay: true,
        }
      );

      this.ambientSound = sound;
      this.isAmbientPlaying = true;
      this.currentAmbientType = type;
      this.ambientVolume = volume;

      // Set up status update handler
      sound.setOnPlaybackStatusUpdate(this.onAmbientPlaybackStatusUpdate);

      return true;
    } catch (error) {
      console.error("Error playing ambient sound:", error);
      return false;
    }
  }

  private onAmbientPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      this.isAmbientPlaying = false;
    }
  };

  async stopAmbientSound(): Promise<void> {
    if (this.ambientSound) {
      try {
        await this.ambientSound.stopAsync();
        await this.ambientSound.unloadAsync();
      } catch (error) {
        console.error("Error stopping ambient sound:", error);
      }
      this.ambientSound = null;
      this.isAmbientPlaying = false;
    }
  }

  async setAmbientVolume(volume: number): Promise<void> {
    this.ambientVolume = volume;
    if (this.ambientSound) {
      try {
        await this.ambientSound.setVolumeAsync(volume);
      } catch (error) {
        console.error("Error setting volume:", error);
      }
    }
  }

  async pauseAmbientSound(): Promise<void> {
    if (this.ambientSound && this.isAmbientPlaying) {
      try {
        await this.ambientSound.pauseAsync();
        this.isAmbientPlaying = false;
      } catch (error) {
        console.error("Error pausing ambient sound:", error);
      }
    }
  }

  async resumeAmbientSound(): Promise<void> {
    if (this.ambientSound && !this.isAmbientPlaying) {
      try {
        await this.ambientSound.playAsync();
        this.isAmbientPlaying = true;
      } catch (error) {
        console.error("Error resuming ambient sound:", error);
      }
    }
  }

  getAmbientStatus() {
    return {
      isPlaying: this.isAmbientPlaying,
      currentType: this.currentAmbientType,
      volume: this.ambientVolume,
    };
  }

  // Alarm Sound Methods
  async playAlarmSound(type: AlarmSoundType): Promise<void> {
    const soundUrl = ALARM_SOUNDS[type];
    if (!soundUrl || type === "none") return;

    try {
      // Unload previous alarm if any
      if (this.alarmSound) {
        await this.alarmSound.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: soundUrl },
        { shouldPlay: true, volume: 1.0 }
      );

      this.alarmSound = sound;

      // Auto-unload after playing
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
          this.alarmSound = null;
        }
      });
    } catch (error) {
      console.error("Error playing alarm sound:", error);
    }
  }

  async previewSound(type: AmbientSoundType | AlarmSoundType, isAmbient: boolean): Promise<Audio.Sound | null> {
    const soundUrl = isAmbient 
      ? AMBIENT_SOUNDS[type as AmbientSoundType] 
      : ALARM_SOUNDS[type as AlarmSoundType];
    
    if (!soundUrl) return null;

    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: soundUrl },
        { shouldPlay: true, volume: isAmbient ? this.ambientVolume : 1.0 }
      );

      // Auto-unload after 5 seconds for preview
      setTimeout(async () => {
        try {
          await sound.stopAsync();
          await sound.unloadAsync();
        } catch (e) {
          // Sound may already be unloaded
        }
      }, 5000);

      return sound;
    } catch (error) {
      console.error("Error previewing sound:", error);
      return null;
    }
  }

  // Cleanup
  async cleanup(): Promise<void> {
    await this.stopAmbientSound();
    if (this.alarmSound) {
      try {
        await this.alarmSound.unloadAsync();
      } catch (e) {
        // Ignore
      }
      this.alarmSound = null;
    }
  }
}

export const audioService = new AudioService();

