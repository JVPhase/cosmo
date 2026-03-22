import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const CORRECT_PASSWORD = "testlaunch86";

export function PasswordScreen({ onUnlock }: { onUnlock: () => void }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = () => {
    if (value === CORRECT_PASSWORD) {
      onUnlock();
    } else {
      setError(true);
      setValue("");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.box}>
        <Text style={styles.icon}>🔒</Text>
        <Text style={styles.title}>ДОСТУП ЗАКРЫТ</Text>
        <Text style={styles.subtitle}>Введите код для входа</Text>

        <TextInput
          style={[styles.input, error ? styles.inputError : null]}
          value={value}
          onChangeText={(t) => { setValue(t); setError(false); }}
          placeholder="••••••••••••"
          placeholderTextColor="rgba(255,255,255,0.15)"
          secureTextEntry
          autoCapitalize="none"
          onSubmitEditing={handleSubmit}
          returnKeyType="done"
        />

        {error && (
          <Text style={styles.errorText}>Неверный код</Text>
        )}

        <Pressable
          onPress={handleSubmit}
          style={({ pressed }) => [styles.btn, pressed ? { opacity: 0.85 } : null]}
        >
          <Text style={styles.btnText}>ВОЙТИ</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#050918",
    alignItems: "center",
    justifyContent: "center",
  },
  box: {
    width: "80%",
    alignItems: "center",
    gap: 12,
  },
  icon: { fontSize: 48, marginBottom: 4 },
  title: {
    fontSize: 14,
    color: "rgba(0,212,255,0.6)",
    fontWeight: "900",
    letterSpacing: 3,
  },
  subtitle: {
    fontSize: 11,
    color: "rgba(255,255,255,0.25)",
    marginBottom: 8,
  },
  input: {
    width: "100%",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(0,212,255,0.25)",
    backgroundColor: "rgba(0,212,255,0.05)",
    color: "#ffffff",
    fontSize: 16,
    textAlign: "center",
    letterSpacing: 2,
  },
  inputError: {
    borderColor: "rgba(255,80,80,0.5)",
    backgroundColor: "rgba(255,40,40,0.06)",
  },
  errorText: {
    fontSize: 10,
    color: "rgba(255,80,80,0.7)",
    fontWeight: "800",
    letterSpacing: 1,
  },
  btn: {
    marginTop: 4,
    width: "100%",
    paddingVertical: 13,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(0,212,255,0.35)",
    backgroundColor: "rgba(0,212,255,0.08)",
    alignItems: "center",
  },
  btnText: {
    fontSize: 12,
    color: "#00d4ff",
    fontWeight: "900",
    letterSpacing: 2,
  },
});
