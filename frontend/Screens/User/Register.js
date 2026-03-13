import React, { useContext, useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import Toast from "react-native-toast-message";
import axios from "axios";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import Constants from "expo-constants";

import EasyButton from "../../Shared/StyledComponents/EasyButton";
import baseURL from "../../assets/common/baseurl";
import AuthGlobal from "../../Context/Store/AuthGlobal";
import { loginGoogleUser } from "../../Context/Actions/Auth.actions";

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_EXPO_CLIENT_ID = Constants.expoConfig?.extra?.googleExpoClientId || "";
const GOOGLE_WEB_CLIENT_ID = Constants.expoConfig?.extra?.googleWebClientId || "";
const GOOGLE_ANDROID_CLIENT_ID =
  Constants.expoConfig?.extra?.googleAndroidClientId || "";

const Register = ({ navigation }) => {
  const context = useContext(AuthGlobal);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
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
      navigation.reset({
        index: 0,
        routes: [{ name: "User Profile" }],
      });
      navigation.getParent()?.navigate("Shop");
    }
  }, [context?.stateUser?.isAuthenticated, navigation]);

  const register = async () => {
    if (!email || !name || !phone || !password) {
      setSuccess("");
      setError("Please fill in all fields");
      return;
    }
    setError("");
    setSuccess("");

    try {
      await axios.post(`${baseURL}users/register`, {
        name,
        email: email.toLowerCase(),
        password,
        phone,
        isAdmin: false,
      });

      Toast.show({
        type: "success",
        text1: "Registration successful",
        text2: "Redirecting to Login...",
        topOffset: 60,
      });

      setSuccess("Registration successful. Redirecting to Login...");
      setTimeout(() => {
        navigation.navigate("Login");
      }, 1200);
    } catch (apiError) {
      setSuccess("");
      setError(apiError?.response?.data?.message || "Registration failed");
    }
  };

  const handleGoogleRegister = async () => {
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
      <Text style={styles.title}>Register</Text>

      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} />
      <TextInput style={styles.input} placeholder="Name" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Phone" value={phone} onChangeText={setPhone} />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {success ? <Text style={styles.success}>{success}</Text> : null}

      <EasyButton primary large onPress={register}>
        <Text style={styles.btn}>Register</Text>
      </EasyButton>
      <EasyButton secondary large onPress={() => navigation.navigate("Login") }>
        <Text style={styles.btn}>Back to Login</Text>
      </EasyButton>
      <EasyButton secondary large onPress={handleGoogleRegister} disabled={!googleRequest}>
        <Text style={styles.btn}>Register with Google</Text>
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

export default Register;