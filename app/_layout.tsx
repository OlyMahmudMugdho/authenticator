import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Authenticator' }} />
      <Stack.Screen name="add" options={{ title: 'Add Account' }} />
    </Stack>
  );
}
