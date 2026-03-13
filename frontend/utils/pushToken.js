import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

import baseURL from "../assets/common/baseurl";

const PUSH_TOKEN_KEY = "devicePushToken";

const getProjectId = () => {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ||
    Constants.easConfig?.projectId ||
    null
  );
};

const getExpoPushToken = async () => {
  const projectId = getProjectId();
  if (projectId) {
    const tokenResult = await Notifications.getExpoPushTokenAsync({ projectId });
    return tokenResult?.data || "";
  }

  const tokenResult = await Notifications.getExpoPushTokenAsync();
  return tokenResult?.data || "";
};

export const registerDevicePushToken = async (jwtToken) => {
  if (!jwtToken || !Device.isDevice) return null;

  const permission = await Notifications.getPermissionsAsync();
  let finalStatus = permission.status;
  if (finalStatus !== "granted") {
    const ask = await Notifications.requestPermissionsAsync();
    finalStatus = ask.status;
  }

  if (finalStatus !== "granted") return null;

  const token = String(await getExpoPushToken()).trim();
  if (!token) return null;

  const response = await fetch(`${baseURL}users/push-token`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwtToken}`,
    },
    body: JSON.stringify({
      token,
      platform: Device.osName || "unknown",
    }),
  });

  if (!response.ok) {
    throw new Error("Unable to register push token");
  }

  await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
  return token;
};

export const removeDevicePushToken = async (jwtToken) => {
  const token = String((await AsyncStorage.getItem(PUSH_TOKEN_KEY)) || "").trim();
  if (!jwtToken || !token) return;

  try {
    await fetch(`${baseURL}users/push-token`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
      body: JSON.stringify({ token }),
    });
  } finally {
    await AsyncStorage.removeItem(PUSH_TOKEN_KEY);
  }
};
