import { View, Text, Button } from 'react-native';
import { useRouter } from 'expo-router';

export default function PlaylistScreen() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 24, marginBottom: 16 }}>Questa è la Playlist!</Text>
      <Button
        title="Torna alla Home"
        onPress={() => router.push('/')}
      />
    </View>
  );
}
