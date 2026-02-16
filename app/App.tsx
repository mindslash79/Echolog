import { StatusBar } from 'expo-status-bar';
import React, { useMemo, useState, useEffect } from 'react';
import { Audio } from 'expo-av';
import { loadEntries, saveEntries } from './src/storage/localStore';
import * as Location from 'expo-location';
import {
  Alert,
  FlatList,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type Entry = {
  id: string;
  createdAt: number; // epoch ms
  placeName: string; // for now default
  content: string;
  lat?: number;
  lng?: number;
  // optional audio block (matches data schema semantics where present)
  audio?: {
    hasAudio: boolean;
    localPath?: string | null;
    durationMs?: number | null;
  };
  transcript?: {
    engine?: string;
    text?: string;
    confidence?: number | null;
  };
};

function formatDateTime(ts: number) {
  const d = new Date(ts);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

export default function App() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [showCoords, setShowCoords] = useState(false);

  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [draftText, setDraftText] = useState('');
  const [draftPlace, setDraftPlace] = useState('Unknown place');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);

  const headerHint = useMemo(() => {
    return entries.length === 0 ? 'No entries yet — add one with Type.' : `${entries.length} entries`;
  }, [entries.length]);

  async function getCoordsIfEnabled(enabled: boolean): Promise<{ lat: number; lng: number } | null> {
    if (!enabled) return null;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return null;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      return { lat: loc.coords.latitude, lng: loc.coords.longitude };
    } catch {
      return null;
    }
  }

  function openType() {
    setEditingId(null);
    setDraftText('');
    setDraftPlace('Unknown place');
    setIsTypeModalOpen(true);
  }

  function openTypeForEdit(entry: Entry) {
    setEditingId(entry.id);
    setDraftText(entry.content);
    setDraftPlace(entry.placeName || 'Unknown place');
    setIsTypeModalOpen(true);
  }

  async function saveTypedEntry() {
    const text = draftText.trim();
    if (!text) {
      Alert.alert('Empty', 'Please type something first.');
      return;
    }
    const coords = await getCoordsIfEnabled(showCoords);

    if (editingId) {
      // update existing; only overwrite coords when we successfully obtained them
      const next = entries.map((e) =>
        e.id === editingId
          ? { ...e, content: text, placeName: draftPlace.trim() || 'Unknown place', lat: coords?.lat ?? e.lat, lng: coords?.lng ?? e.lng }
          : e
      );
      setEntries(next);
      try {
        await saveEntries(next);
      } catch (e) {}
      setEditingId(null);
      setIsTypeModalOpen(false);
      return;
    }

    const now = Date.now();
    const newEntry: Entry = {
      id: String(now),
      createdAt: now,
      placeName: draftPlace.trim() || 'Unknown place',
      content: text,
      lat: coords?.lat,
      lng: coords?.lng,
    };
    const next = [newEntry, ...entries];
    setEntries(next);
    try {
      await saveEntries(next);
    } catch (e) {
      // ignore storage errors for now
    }
    setIsTypeModalOpen(false);
  }

  async function startRecording() {
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('Microphone permission denied');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const rec = new Audio.Recording();
      // prepare and start with default options; cast to any to avoid typing mismatches across SDKs
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      await rec.prepareToRecordAsync({} as any);
      await rec.startAsync();
      setRecording(rec);
    } catch (e) {
      console.warn('startRecording failed', e);
      setRecording(null);
    }
  }

  async function stopRecordingAndSave() {
    if (!recording) return;
    try {
      await recording.stopAndUnloadAsync();
    } catch (e) {
      // ignore
    }
    try {
      const uri = recording.getURI();
      const status = await recording.getStatusAsync();
      const durationMs = status?.durationMillis ?? null;

      // attach as new sound entry
      const coords = await getCoordsIfEnabled(showCoords);
      const now = Date.now();
      const newEntry: Entry = {
        id: String(now),
        createdAt: now,
        placeName: 'Unknown place',
        content: '',
        lat: coords?.lat,
        lng: coords?.lng,
        transcript: { engine: 'none' },
        audio: { hasAudio: !!uri, localPath: uri ?? null, durationMs },
      };
      const next = [newEntry, ...entries];
      setEntries(next);
      try {
        await saveEntries(next);
      } catch (e) {}
    } catch (e) {
      console.warn('save recording failed', e);
    } finally {
      setRecording(null);
    }
  }

  async function deleteEntry(id: string) {
    const ok = await new Promise<boolean>((resolve) => {
      Alert.alert('Delete', 'Delete this entry?', [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Delete', style: 'destructive', onPress: () => resolve(true) },
      ]);
    });
    if (!ok) return;
    const next = entries.filter((e) => e.id !== id);
    setEntries(next);
    try {
      await saveEntries(next);
    } catch (e) {}
  }

  useEffect(() => {
    (async () => {
      try {
        const stored = await loadEntries<Entry>();
        if (stored && Array.isArray(stored) && stored.length > 0) {
          setEntries(stored);
        }
      } catch (e) {
        // ignore load errors
      }
    })();
  }, []);

  async function playAudio(uri: string) {
    try {
      const { sound } = await Audio.Sound.createAsync({ uri });
      await sound.playAsync();
    } catch (e) {
      console.warn('playAudio failed', e);
      Alert.alert('Playback failed');
    }
  }

  function onPressEntry(item: Entry) {
    if (item.audio?.hasAudio && item.audio.localPath) {
      Alert.alert('Entry', item.content || 'Audio entry', [
        { text: 'Play', onPress: () => playAudio(item.audio!.localPath!) },
        { text: 'Edit', onPress: () => openTypeForEdit(item) },
        { text: 'Delete', style: 'destructive', onPress: () => deleteEntry(item.id) },
        { text: 'Cancel', style: 'cancel' },
      ]);
      return;
    }
    Alert.alert('Entry', item.content, [
      { text: 'Copy (later)', onPress: () => {} },
      { text: 'OK' },
    ]);
  }

  function onLongPressEntry(item: Entry) {
    Alert.alert('Actions', undefined, [
      { text: 'Edit', onPress: () => openTypeForEdit(item) },
      { text: 'Delete', style: 'destructive', onPress: () => deleteEntry(item.id) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Echolog</Text>

        {/* top area spacer — main actions moved to bottom bar */}

        <View style={styles.toolsRow}>
          <TouchableOpacity
            style={[styles.smallBtn, showCoords && styles.smallBtnOn]}
            onPress={() => setShowCoords((v) => !v)}
          >
            <Text style={styles.smallBtnText}>{showCoords ? 'Coords: ON' : 'Coords: OFF'}</Text>
          </TouchableOpacity>

          <Text style={styles.hint}>{headerHint}</Text>
        </View>

        <View style={styles.listHeader}>
          <Text style={[styles.col, styles.colTime]}>Date/Time</Text>
          <Text style={[styles.col, styles.colPlace]}>Place</Text>
          <Text style={[styles.col, styles.colContent]}>Content</Text>
          {showCoords ? <Text style={[styles.col, styles.colCoords]}>Coords</Text> : null}
        </View>

        <FlatList
          data={entries}
          keyExtractor={(it) => it.id}
          contentContainerStyle={entries.length === 0 ? [styles.emptyWrap, { paddingBottom: 120 }] : { paddingBottom: 120 }}
          ListEmptyComponent={<Text style={styles.empty}>No entries yet.</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.item}
              onPress={() => onPressEntry(item)}
              onLongPress={() => onLongPressEntry(item)}
              delayLongPress={350}
            >
              <Text style={[styles.itemText, styles.colTime]}>{formatDateTime(item.createdAt)}</Text>
              <Text style={[styles.itemText, styles.colPlace]} numberOfLines={1}>
                {item.placeName}
              </Text>
              <Text style={[styles.itemText, styles.colContent]} numberOfLines={2}>
                {item.content}
              </Text>
              {showCoords ? (
                <Text style={[styles.itemText, styles.colCoords]} numberOfLines={1}>
                  {item.lat?.toFixed(4)}, {item.lng?.toFixed(4)}
                </Text>
              ) : null}
            </TouchableOpacity>
          )}
        />

        {/* Bottom action bar (fixed) */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.button}
            onPressIn={startRecording}
            onPressOut={stopRecordingAndSave}
          >
            <Text style={styles.buttonText}>{recording ? '● Recording...' : '🎤 Hold to Record'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={openType}>
            <Text style={styles.buttonText}>⌨️ Type</Text>
          </TouchableOpacity>
        </View>

        {/* Type Modal */}
        <Modal visible={isTypeModalOpen} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>New entry (Type)</Text>

              <Text style={styles.label}>Place name</Text>
              <TextInput
                value={draftPlace}
                onChangeText={setDraftPlace}
                placeholder="e.g., Home, Office, Cafe"
                placeholderTextColor="#777"
                style={styles.input}
              />

              <Text style={styles.label}>Content</Text>
              <TextInput
                value={draftText}
                onChangeText={setDraftText}
                placeholder="Type your note..."
                placeholderTextColor="#777"
                style={[styles.input, styles.textArea]}
                multiline
              />

              <View style={styles.modalRow}>
                <TouchableOpacity style={[styles.modalBtn, styles.modalBtnGhost]} onPress={() => setIsTypeModalOpen(false)}>
                  <Text style={styles.modalBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtn, styles.modalBtnPrimary]} onPress={saveTypedEntry}>
                  <Text style={styles.modalBtnText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <StatusBar style="light" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f0f10' },
  container: { flex: 1, padding: 16, backgroundColor: '#0f0f10' },

  title: { fontSize: 28, color: 'white', marginBottom: 16, textAlign: 'center' },

  row: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  button: {
    flex: 1,
    backgroundColor: '#2a2a2c',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonText: { color: 'white', fontSize: 18 },

  toolsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  smallBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#1f1f21',
  },
  smallBtnOn: { backgroundColor: '#343438' },
  smallBtnText: { color: '#ddd', fontSize: 12 },
  hint: { color: '#aaa', fontSize: 12 },

  listHeader: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#222',
    paddingVertical: 8,
    marginBottom: 6,
  },
  col: { color: '#bbb', fontSize: 12 },
  colTime: { flex: 1.2 },
  colPlace: { flex: 1.1 },
  colContent: { flex: 2.2 },
  colCoords: { flex: 1.3, textAlign: 'right' },

  item: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#18181a',
  },
  itemText: { color: '#eee', fontSize: 12 },

  emptyWrap: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { color: '#666' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#141416',
    padding: 16,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderTopWidth: 1,
    borderColor: '#222',
  },
  modalTitle: { color: 'white', fontSize: 18, marginBottom: 12 },

  label: { color: '#bbb', fontSize: 12, marginTop: 10, marginBottom: 6 },
  input: {
    backgroundColor: '#1f1f21',
    color: 'white',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  textArea: { height: 120, textAlignVertical: 'top' },

  modalRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  modalBtnGhost: { backgroundColor: '#232326' },
  modalBtnPrimary: { backgroundColor: '#2f2f35' },
  modalBtnText: { color: 'white', fontSize: 16 },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#111',
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderColor: '#222',
  },
});
