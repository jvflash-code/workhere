import { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';

const { width, height } = Dimensions.get('window');

type Props = {
  visible: boolean;
  onClose: () => void;
  videoUri: string;
  name: string;
  role: string;
  color: string;
  initials: string;
};

export default function VideoPlayer({ visible, onClose, videoUri, name, role, color, initials }: Props) {
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!visible) {
      videoRef.current?.pauseAsync();
      setIsPlaying(false);
      setProgress(0);
    } else {
      // Auto-play when opened
      setTimeout(() => {
        videoRef.current?.playAsync();
        setIsPlaying(true);
      }, 300);
    }
  }, [visible]);

  function onPlaybackStatusUpdate(status: AVPlaybackStatus) {
    if (!status.isLoaded) return;
    setIsPlaying(status.isPlaying);
    setProgress(status.positionMillis ?? 0);
    setDuration(status.durationMillis ?? 0);
  }

  async function togglePlay() {
    if (isPlaying) {
      await videoRef.current?.pauseAsync();
    } else {
      await videoRef.current?.playAsync();
    }
  }

  function formatTime(ms: number) {
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  }

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <View style={styles.container}>
        {/* Video */}
        <Video
          ref={videoRef}
          source={{ uri: videoUri }}
          style={styles.video}
          resizeMode={ResizeMode.COVER}
          onPlaybackStatusUpdate={onPlaybackStatusUpdate}
          shouldPlay={false}
          useNativeControls={false}
        />

        {/* Overlay */}
        <View style={styles.overlay}>
          {/* Top bar */}
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Center play/pause */}
          <TouchableOpacity style={styles.centerPlay} onPress={togglePlay} activeOpacity={0.8}>
            <Text style={styles.centerPlayIcon}>{isPlaying ? '⏸' : '▶'}</Text>
          </TouchableOpacity>

          {/* Bottom info */}
          <View style={styles.bottomBar}>
            <View style={styles.speakerRow}>
              <View style={[styles.avatar, { backgroundColor: color }]}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <View>
                <Text style={styles.speakerName}>{name}</Text>
                <Text style={styles.speakerRole}>{role}</Text>
              </View>
            </View>

            {/* Progress bar */}
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
            </View>
            <View style={styles.timeRow}>
              <Text style={styles.timeText}>{formatTime(progress)}</Text>
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  video: { width, height },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topBar: {
    paddingTop: 56,
    paddingHorizontal: 20,
    alignItems: 'flex-end',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { color: 'white', fontSize: 14, fontWeight: '600' },
  centerPlay: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerPlayIcon: { fontSize: 24, color: 'white' },
  bottomBar: {
    padding: 24,
    paddingBottom: 48,
    backgroundColor: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
  },
  speakerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  avatarText: { color: 'white', fontWeight: '700', fontSize: 15 },
  speakerName: { color: 'white', fontSize: 16, fontWeight: '700' },
  speakerRole: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 2 },
  progressBg: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    marginBottom: 6,
  },
  progressFill: {
    height: 3,
    backgroundColor: 'white',
    borderRadius: 2,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },
});
