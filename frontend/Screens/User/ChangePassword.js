import React, { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Toast from "react-native-toast-message";

import EasyButton from "../../Shared/StyledComponents/EasyButton";
import baseURL from "../../assets/common/baseurl";

const ChangePassword = ({ navigation }) => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!oldPassword || !newPassword || !confirmNewPassword) {
      Toast.show({
        type: "error",
        text1: "Missing fields",
        text2: "Please fill in all password fields",
        topOffset: 60,
      });
      return;
    }

    if (newPassword.length < 6) {
      Toast.show({
        type: "error",
        text1: "Weak password",
        text2: "New password must be at least 6 characters",
        topOffset: 60,
      });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      Toast.show({
        type: "error",
        text1: "Mismatch",
        text2: "New password confirmation does not match",
        topOffset: 60,
      });
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("jwt");

      await axios.post(
        `${baseURL}users/change-password`,
        {
          oldPassword,
          newPassword,
          confirmNewPassword,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setOldPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      Toast.show({
        type: "success",
        text1: "Password changed",
        topOffset: 60,
      });
      navigation.goBack();
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Change failed",
        text2: error?.response?.data?.message || "Please try again",
        topOffset: 60,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Change Password</Text>

      <TextInput
        style={styles.input}
        value={oldPassword}
        onChangeText={setOldPassword}
        placeholder="Old Password"
        secureTextEntry
      />

      <TextInput
        style={styles.input}
        value={newPassword}
        onChangeText={setNewPassword}
        placeholder="New Password"
        secureTextEntry
      />

      <TextInput
        style={styles.input}
        value={confirmNewPassword}
        onChangeText={setConfirmNewPassword}
        placeholder="Confirm New Password"
        secureTextEntry
      />

      <EasyButton primary large onPress={submit}>
        <Text style={styles.btnText}>{loading ? "Updating..." : "Update Password"}</Text>
      </EasyButton>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 10,
    height: 46,
  },
  btnText: { color: "white", fontWeight: "700" },
});

export default ChangePassword;
