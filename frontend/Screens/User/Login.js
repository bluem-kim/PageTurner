import React, { useContext, useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import AuthGlobal from "../../Context/Store/AuthGlobal";
import { loginUser } from "../../Context/Actions/Auth.actions";
import EasyButton from "../../Shared/StyledComponents/EasyButton";

const Login = ({ navigation }) => {
  const context = useContext(AuthGlobal);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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