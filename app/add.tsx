import React, { useState, useEffect } from "react";
import { View, TextInput, Button, StyleSheet, Alert, Text } from "react-native";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AddForm() {
  const [username, setUsername] = useState("");
  const [secret, setSecret] = useState("");
  const [scanning, setScanning] = useState(false);
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    if (!permission) requestPermission();
  }, [permission]);

  const handleSubmit = async (scannedAccount?: {
    username: string;
    secret: string;
  }) => {
    const accountToSave = scannedAccount || { username, secret };

    if (!accountToSave.username || !accountToSave.secret) {
      Alert.alert("Error", "Please fill in both fields.");
      return;
    }

    try {
      const storedData = await SecureStore.getItemAsync("accounts");
      const accounts = storedData ? JSON.parse(storedData) : [];
      accounts.push(accountToSave);
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
      const pathname = decodeURIComponent(url.pathname);
      const appname =
        pathname.split(":")[1] || pathname.split("/")[1] || "Unknown";
      const secretParam = url.searchParams.get("secret");

      if (secretParam) {
        setUsername(appname);
        setSecret(secretParam);
        handleSubmit({ username: appname, secret: secretParam }); // ✅ use direct values
        Alert.alert("Success", "Secret scanned and saved!");
      } else {
        Alert.alert("Error", "Invalid QR code (no secret found).");
      }
    } catch (err) {
      console.error("QR parse error:", err);
      Alert.alert("Error", "Failed to parse QR code.");
    }
  };

  if (scanning) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          onBarcodeScanned={handleBarCodeScanned}
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        />
        <Button title="Cancel" onPress={() => setScanning(false)} />
      </SafeAreaView>
    );
  }

  if (!permission) return <View />;
  if (!permission.granted)
    return <Text>No access to camera. Enable permissions in settings.</Text>;

  return (
    <SafeAreaView style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Account Name..."
        placeholderTextColor="gray"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Secret Key..."
        placeholderTextColor="gray"
        value={secret}
        onChangeText={setSecret}
      />

      <Button title="Scan QR Code" onPress={() => setScanning(true)} />
      <View style={{ marginTop: 12 }} />
      <Button title="Save Account" onPress={() => handleSubmit()} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
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
