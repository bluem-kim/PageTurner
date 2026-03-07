import React, { useContext, useEffect, useState } from "react";
import { Image, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Toast from "react-native-toast-message";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";

import EasyButton from "../../Shared/StyledComponents/EasyButton";
import baseURL from "../../assets/common/baseurl";
import AuthGlobal from "../../Context/Store/AuthGlobal";
import { setCurrentUser } from "../../Context/Actions/Auth.actions";

const FALLBACK_AVATAR =
  "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png";

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseBirthday = (value) => {
  if (!value) return new Date();
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return new Date();
  return parsed;
};

const EditProfile = ({ navigation }) => {
  const context = useContext(AuthGlobal);
  const profile = context?.stateUser?.userProfile || {};

  const [name, setName] = useState(profile.name || "");
  const [email, setEmail] = useState(profile.email || "");
  const [phone, setPhone] = useState(profile.phone || "");
  const [birthday, setBirthday] = useState(profile.birthday || "");
  const [address, setAddress] = useState(profile.address || "");
  const [avatar, setAvatar] = useState(profile.avatar || "");
  const [pickedAvatar, setPickedAvatar] = useState(null);
  const [showBirthdayPicker, setShowBirthdayPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const token = await AsyncStorage.getItem("jwt");
        const res = await axios.get(`${baseURL}users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setName(res.data?.name || "");
        setEmail(res.data?.email || "");
        setPhone(res.data?.phone || "");
        setBirthday(res.data?.birthday || "");
        setAddress(res.data?.address || "");
        setAvatar(res.data?.avatar || "");
      } catch (error) {
        // Keep locally available profile values.
      }
    };

    loadProfile();
  }, []);

  const chooseFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") {
      Toast.show({
        type: "error",
        text1: "Permission denied",
        text2: "Allow photo access to update avatar",
        topOffset: 60,
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    setPickedAvatar(asset);
    setAvatar(asset.uri);
  };

  const takePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (permission.status !== "granted") {
        Toast.show({
          type: "error",
          text1: "Permission denied",
          text2: "Allow camera access to take profile photo",
          topOffset: 60,
        });
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.length) return;
      const asset = result.assets[0];
      setPickedAvatar(asset);
      setAvatar(asset.uri);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Camera unavailable",
        text2: "Use Upload Photo when camera is not available",
        topOffset: 60,
      });
    }
  };

  const save = async () => {
    const cleanName = String(name || "").trim();
    const cleanEmail = String(email || "").toLowerCase().trim();
    const cleanPhone = String(phone || "").trim();
    const cleanBirthday = String(birthday || "").trim();
    const cleanAddress = String(address || "").trim();

    if (!cleanName || !cleanEmail) {
      Toast.show({
        type: "error",
        text1: "Missing fields",
        text2: "Name and email are required",
        topOffset: 60,
      });
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("jwt");

      let responseData;
      if (pickedAvatar?.uri) {
        const payload = new FormData();
        payload.append("name", cleanName);
        payload.append("email", cleanEmail);
        payload.append("phone", cleanPhone);
        payload.append("birthday", cleanBirthday);
        payload.append("address", cleanAddress);
        payload.append("avatar", {
          uri: pickedAvatar.uri,
          name: pickedAvatar.fileName || `avatar-${Date.now()}.jpg`,
          type: pickedAvatar.mimeType || "image/jpeg",
        });

        const response = await fetch(`${baseURL}users/profile`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: payload,
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.message || "Please try again");
        }
        responseData = data;
      } else {
        const res = await axios.post(
          `${baseURL}users/profile`,
          {
            name: cleanName,
            email: cleanEmail,
            phone: cleanPhone,
            birthday: cleanBirthday,
            address: cleanAddress,
            avatar,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        responseData = res.data;
      }

      const updatedProfile = {
        userId: responseData.id,
        name: responseData.name,
        email: responseData.email,
        phone: responseData.phone,
        birthday: responseData.birthday,
        address: responseData.address,
        avatar: responseData.avatar,
        isAdmin: responseData.isAdmin,
      };

      await AsyncStorage.setItem("userProfile", JSON.stringify(updatedProfile));
      context.dispatch(setCurrentUser(context.stateUser.user, updatedProfile));

      Toast.show({
        type: "success",
        text1: "Profile updated",
        topOffset: 60,
      });
      navigation.goBack();
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Update failed",
        text2: error?.response?.data?.message || error?.message || "Please try again",
        topOffset: 60,
      });
    } finally {
      setLoading(false);
    }
  };

  const onBirthdayChange = (event, selectedDate) => {
    if (Platform.OS === "android") {
      setShowBirthdayPicker(false);
    }

    if (event?.type === "dismissed" || !selectedDate) {
      return;
    }

    setBirthday(formatDate(selectedDate));
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Edit Profile</Text>

      <View style={styles.avatarWrap}>
        <Image source={{ uri: avatar || FALLBACK_AVATAR }} style={styles.avatar} />
        <View style={styles.avatarButtons}>
          <TouchableOpacity style={styles.photoActionBtn} onPress={chooseFromGallery} activeOpacity={0.85}>
            <Text style={styles.btnText}>Upload Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.photoActionBtn} onPress={takePhoto} activeOpacity={0.85}>
            <Text style={styles.btnText}>Take Photo</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Full Name" />
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        autoCapitalize="none"
      />
      <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Phone" />
      <TouchableOpacity style={styles.dateField} onPress={() => setShowBirthdayPicker(true)} activeOpacity={0.85}>
        <Text style={birthday ? styles.dateValue : styles.datePlaceholder}>
          {birthday || "Select Birthday"}
        </Text>
      </TouchableOpacity>
      {showBirthdayPicker ? (
        <View style={styles.pickerWrap}>
          <DateTimePicker
            value={parseBirthday(birthday)}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            maximumDate={new Date()}
            onChange={onBirthdayChange}
          />
          {Platform.OS === "ios" ? (
            <TouchableOpacity style={styles.doneDateBtn} onPress={() => setShowBirthdayPicker(false)}>
              <Text style={styles.doneDateBtnText}>Done</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}
      <TextInput
        style={[styles.input, styles.addressInput]}
        value={address}
        onChangeText={setAddress}
        placeholder="Address"
        multiline
      />

      <EasyButton primary large onPress={save}>
        <Text style={styles.btnText}>{loading ? "Saving..." : "Save Profile"}</Text>
      </EasyButton>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: "white",
  },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 12 },
  avatarWrap: {
    alignItems: "center",
    marginBottom: 14,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#f1f3f5",
  },
  avatarButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
    width: "100%",
    justifyContent: "center",
    gap: 8,
  },
  photoActionBtn: {
    backgroundColor: "#0077b6",
    borderRadius: 8,
    minWidth: 130,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 10,
    height: 44,
  },
  dateField: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 10,
    height: 44,
    justifyContent: "center",
    backgroundColor: "white",
  },
  dateValue: {
    color: "#222",
  },
  datePlaceholder: {
    color: "#8a8a8a",
  },
  pickerWrap: {
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 10,
    backgroundColor: "#fafafa",
  },
  doneDateBtn: {
    alignSelf: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 6,
    marginBottom: 6,
    backgroundColor: "#0077b6",
    borderRadius: 8,
  },
  doneDateBtnText: {
    color: "white",
    fontWeight: "700",
  },
  addressInput: {
    height: 90,
    textAlignVertical: "top",
    paddingTop: 10,
  },
  btnText: { color: "white", fontWeight: "700" },
});

export default EditProfile;
