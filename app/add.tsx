import React, { useState, useEffect } from "react";
import { View, TextInput, Button, StyleSheet, Alert, Text } from "react-native";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";

export default function AddForm() {
  const [username, setUsername] = useState("");
  const [secret, setSecret] = useState("");
  const [scanning, setScanning] = useState(false);
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    if (!permission) requestPermission();
  }, [permission]);

  const handleSubmit = async () => {
    if (!username || !secret) {
      Alert.alert("Error", "Please fill in both fields.");
      return;
    }

    const account = { username, secret };

    try {
      const storedData = await SecureStore.getItemAsync("accounts");
      const accounts = storedData ? JSON.parse(storedData) : [];
      accounts.push(account);
      await SecureStore.setItemAsync("accounts", JSON.stringify(accounts));
      Alert.alert("Success", "Account saved securely.");
      setUsername("");
      setSecret("");
      router.push("/");
    } catch (error) {
      console.error("Error saving account:", error);
      Alert.alert("Error", "Failed to save account.");
    }
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    setScanning(false);
    try {
      const url = new URL(data);
      const secretParam = url.searchParams.get("secret");
      if (secretParam) {
        setSecret(secretParam);
        Alert.alert("Success", "Secret scanned from QR code!");
      } else {
        Alert.alert("Error", "Invalid QR code.");
      }
    } catch {
      Alert.alert("Error", "Failed to parse QR code.");
    }
  };

  if (scanning) {
    return (
      <View style={{ flex: 1 }}>
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          onBarcodeScanned={handleBarCodeScanned}
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        />
        <Button title="Cancel" onPress={() => setScanning(false)} />
      </View>
    );
  }

  if (!permission) return <View />;
  if (!permission.granted)
    return <Text>No access to camera. Enable permissions in settings.</Text>;

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Account Name..."
        placeholderTextColor="black"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Secret Key..."
        placeholderTextColor="black"
        value={secret}
        onChangeText={setSecret}
      />

      <Button title="Scan QR Code" onPress={() => setScanning(true)} />
      <View style={{ marginTop: 12 }} />
      <Button title="Save Account" onPress={handleSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    marginBottom: 200,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    fontSize: 16,
  },
});
