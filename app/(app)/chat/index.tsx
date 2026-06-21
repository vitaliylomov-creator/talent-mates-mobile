import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../../src/lib/theme';

// D1 stub — D3 replaces with full chat (ChatBubble, ChatInput, voice, agents).
export default function ChatScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <Text style={styles.title}>On the line.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.purple },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: theme.fonts.display, fontSize: 32, color: theme.colors.t1 },
});
