import { Audio, AVPlaybackStatus } from "expo-av";

export type AmbientSoundType =
  | "none"
  | "rain"
  | "forest"
  | "cafe"
  | "ocean"
  | "fireplace";
export type AlarmSoundType = "bell" | "chime" | "digital" | "gentle" | "none";

// Local ambient sound files
const AMBIENT_SOUNDS: Record<AmbientSoundType, any> = {
  none: null,
  rain: require("../../assets/sounds/gentle-rain-07-437321.mp3"),
  forest: require("../../assets/sounds/forest-daytime-446356.mp3"),
  cafe: require("../../assets/sounds/people-talking-at-cafe-ambience-6159.mp3"),
  ocean: require("../../assets/sounds/ocean-waves-250310.mp3"),
  fireplace: require("../../assets/sounds/fireplace-6354.mp3"),
};

// Local alarm sound files
const ALARM_SOUNDS: Record<AlarmSoundType, any> = {
  none: null,
  bell: require("../../assets/sounds/bell.mp3"),
  chime: require("../../assets/sounds/chime.mp3"),
  digital: require("../../assets/sounds/digitsl.mp3"),
  gentle: require("../../assets/sounds/gentle.mp3"),
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
  async playAmbientSound(
    type: AmbientSoundType,
    volume: number = 0.5
  ): Promise<boolean> {
    const soundSource = AMBIENT_SOUNDS[type];
    if (!soundSource || type === "none") {
      await this.stopAmbientSound();
      return false;
    }

    try {
      // Stop existing sound first
      await this.stopAmbientSound();

      const { sound } = await Audio.Sound.createAsync(soundSource, {
        isLooping: true,
        volume: volume,
        shouldPlay: true,
      });

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
    const soundSource = ALARM_SOUNDS[type];
    if (!soundSource || type === "none") return;

    try {
      // Unload previous alarm if any
      if (this.alarmSound) {
        await this.alarmSound.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync(soundSource, {
        shouldPlay: true,
        volume: 1.0,
      });

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

  async previewAmbientSound(
    type: AmbientSoundType
  ): Promise<Audio.Sound | null> {
    const soundSource = AMBIENT_SOUNDS[type];
    if (!soundSource || type === "none") return null;

    try {
      const { sound } = await Audio.Sound.createAsync(soundSource, {
        shouldPlay: true,
        volume: this.ambientVolume,
        isLooping: true,
      });

      return sound;
    } catch (error) {
      console.error("Error previewing ambient sound:", error);
      return null;
    }
  }

  async previewAlarmSound(type: AlarmSoundType): Promise<Audio.Sound | null> {
    const soundSource = ALARM_SOUNDS[type];
    if (!soundSource || type === "none") return null;

    try {
      const { sound } = await Audio.Sound.createAsync(soundSource, {
        shouldPlay: true,
        volume: 1.0,
      });

      // Auto-unload after playing
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });

      return sound;
    } catch (error) {
      console.error("Error previewing alarm sound:", error);
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
