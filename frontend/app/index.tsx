import { View, Text, Button } from 'react-native';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 24, marginBottom: 16 }}>Benvenuto su Aso Music!</Text>
      <Button
        title="Vai alla playlist"
        onPress={() => router.push('/playlist')}
      />
    </View>
  );
}
