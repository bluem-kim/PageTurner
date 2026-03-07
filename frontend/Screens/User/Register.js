import React, { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import Toast from "react-native-toast-message";
import axios from "axios";

import EasyButton from "../../Shared/StyledComponents/EasyButton";
import baseURL from "../../assets/common/baseurl";

const Register = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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