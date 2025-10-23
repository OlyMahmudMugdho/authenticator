import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import { Link, useFocusEffect } from "expo-router";
import { generateTOTP } from "../utils/totp";

export default function HomeScreen() {
  const [accounts, setAccounts] = useState<
    { username: string; secret: string; otp: string; remaining: number }[]
  >([]);

  const loadAccounts = async () => {
    try {
      const storedData = await SecureStore.getItemAsync("accounts");
      const parsed = storedData ? JSON.parse(storedData) : [];
      const withOTP = parsed.map(
        (account: { secret: string; username: string }) => {
          const otp = generateTOTP(account.secret);
          const epoch = Math.floor(Date.now() / 1000);
          const remaining = 30 - (epoch % 30);
          return { ...account, otp, remaining };
        },
      );
      setAccounts(withOTP);
    } catch (error) {
      console.error("Error loading accounts:", error);
    }
  };

  const deleteAccount = async (indexToDelete: number) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this account?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const updatedAccounts = accounts.filter(
                (_, i) => i !== indexToDelete,
              );
              const saveAccounts = updatedAccounts.map(
                ({ username, secret }) => ({
                  username,
                  secret,
                }),
              );
              await SecureStore.setItemAsync(
                "accounts",
                JSON.stringify(saveAccounts),
              );
              setAccounts(updatedAccounts);
            } catch (error) {
              console.error("Error deleting account:", error);
              Alert.alert("Error", "Failed to delete account.");
            }
          },
        },
      ],
    );
  };

  useEffect(() => {
    loadAccounts();
    const interval = setInterval(() => {
      setAccounts((prev) =>
        prev.map((account) => {
          const otp = generateTOTP(account.secret);
          const epoch = Math.floor(Date.now() / 1000);
          const remaining = 30 - (epoch % 30);
          return { ...account, otp, remaining };
        }),
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useFocusEffect(() => {
    loadAccounts();
  });

  return (
    <View style={styles.container}>
      <Link asChild href="/add" style={styles.addButton}>
        <Text style={styles.addText}>Add Account</Text>
      </Link>

      <Text style={styles.title}>Saved Accounts</Text>

      {accounts.length === 0 ? (
        <Text style={styles.empty}>No accounts saved yet.</Text>
      ) : (
        <FlatList
          data={accounts}
          keyExtractor={(_, i) => i.toString()}
          renderItem={({ item, index }) => (
            <View style={styles.account}>
              <View style={styles.accountInfo}>
                <Text style={styles.username}>{item.username}</Text>
                <Text style={styles.otp}>
                  OTP: {item.otp}
                  {"\n"}
                  <Text>(valid for {item.remaining}s)</Text>
                </Text>
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deleteAccount(index)}
              >
                <Text style={styles.deleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, marginTop: 50 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 15 },
  empty: { color: "#888", marginBottom: 15 },
  account: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  accountInfo: { flex: 1, marginRight: 10 },
  username: { fontSize: 16, fontWeight: "bold" },
  secret: { fontSize: 14, color: "#666" },
  otp: { fontSize: 18, color: "#007bff", marginTop: 4 },
  addButton: {
    backgroundColor: "#007bff",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 50,
  },
  addText: { color: "#fff", fontWeight: "bold", textAlign: "center" },
  deleteButton: {
    backgroundColor: "#dc3545",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  deleteText: { color: "#fff", fontWeight: "bold" },
});
