import { StatusBar } from 'expo-status-bar';
import React, { useMemo, useState, useEffect } from 'react';
import { loadEntries, saveEntries } from './app/src/storage/localStore';
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

  const headerHint = useMemo(() => {
    return entries.length === 0 ? 'No entries yet — add one with Type.' : `${entries.length} entries`;
  }, [entries.length]);

  function openType() {
    setDraftText('');
    setDraftPlace('Unknown place');
    setIsTypeModalOpen(true);
  }

  async function saveTypedEntry() {
    const text = draftText.trim();
    if (!text) {
      Alert.alert('Empty', 'Please type something first.');
      return;
    }
    const now = Date.now();
    const newEntry: Entry = {
      id: String(now),
      createdAt: now,
      placeName: draftPlace.trim() || 'Unknown place',
      content: text,
      lat: 43.6532, // TODO: replace with real GPS
      lng: -79.3832,
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

  function onPressEntry(item: Entry) {
    Alert.alert(
      'Entry',
      item.content,
      [
        { text: 'Copy (later)', onPress: () => {} },
        { text: 'OK' },
      ],
      { cancelable: true }
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Echolog</Text>

        <View style={styles.row}>
          <TouchableOpacity style={styles.button} onPress={() => Alert.alert('Record', 'Next step: audio recording')}>
            <Text style={styles.buttonText}>🎤 Record</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={openType}>
            <Text style={styles.buttonText}>⌨️ Type</Text>
          </TouchableOpacity>
        </View>

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
          contentContainerStyle={entries.length === 0 ? styles.emptyWrap : undefined}
          ListEmptyComponent={<Text style={styles.empty}>No entries yet.</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.item} onPress={() => onPressEntry(item)}>
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
});
