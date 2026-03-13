import React, { useContext, useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import Constants from "expo-constants";

import AuthGlobal from "../../Context/Store/AuthGlobal";
import { loginGoogleUser, loginUser } from "../../Context/Actions/Auth.actions";
import EasyButton from "../../Shared/StyledComponents/EasyButton";

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_EXPO_CLIENT_ID = Constants.expoConfig?.extra?.googleExpoClientId || "";
const GOOGLE_WEB_CLIENT_ID = Constants.expoConfig?.extra?.googleWebClientId || "";
const GOOGLE_ANDROID_CLIENT_ID =
  Constants.expoConfig?.extra?.googleAndroidClientId || "";

const Login = ({ navigation }) => {
  const context = useContext(AuthGlobal);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [googleRequest, googleResponse, promptGoogleLogin] = Google.useIdTokenAuthRequest({
    expoClientId: GOOGLE_EXPO_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    webClientId: GOOGLE_WEB_CLIENT_ID,
  });

  useEffect(() => {
    if (context?.stateUser?.isAuthenticated) {
      setSuccess("Login successful. Redirecting to shop...");
      const timer = setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: "User Profile" }],
        });
        navigation.getParent()?.navigate("Shop");
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [context?.stateUser?.isAuthenticated, navigation]);

  const handleSubmit = async () => {
    if (!email || !password) {
      setSuccess("");
      setError("Please fill in your credentials");
      return;
    }
    setError("");
    setSuccess("");
    await loginUser({ email, password }, context.dispatch);
  };

  const handleGoogleLogin = async () => {
    setError("");
    setSuccess("");
    if (!GOOGLE_EXPO_CLIENT_ID || !GOOGLE_WEB_CLIENT_ID) {
      setError("Missing Google OAuth client IDs in app config");
      return;
    }
    await promptGoogleLogin();
  };

  useEffect(() => {
    if (googleResponse?.type !== "success") return;
    const idToken =
      String(googleResponse?.params?.id_token || "").trim() ||
      String(googleResponse?.authentication?.idToken || "").trim();
    if (!idToken) {
      setError("Google sign-in did not return an ID token");
      return;
    }

    loginGoogleUser(idToken, context.dispatch);
  }, [googleResponse, context.dispatch]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {success ? <Text style={styles.success}>{success}</Text> : null}

      <EasyButton primary large onPress={handleSubmit}>
        <Text style={styles.btn}>Login</Text>
      </EasyButton>
      <EasyButton secondary large onPress={() => navigation.navigate("Register") }>
        <Text style={styles.btn}>Create Account</Text>
      </EasyButton>
      <EasyButton secondary large onPress={handleGoogleLogin} disabled={!googleRequest}>
        <Text style={styles.btn}>Continue with Google</Text>
      </EasyButton>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 16 },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 18 },
  input: {
    width: "100%",
    height: 48,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
    backgroundColor: "white",
  },
  error: { color: "#c1121f", marginBottom: 6 },
  success: { color: "#1f8a70", marginBottom: 6, fontWeight: "600" },
  btn: { color: "white", fontWeight: "700" },
});

export default Login;