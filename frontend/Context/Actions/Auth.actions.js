import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import { jwtDecode } from "jwt-decode";

import baseURL from "../../assets/common/baseurl";

export const SET_CURRENT_USER = "SET_CURRENT_USER";

export const setCurrentUser = (decoded, user) => ({
  type: SET_CURRENT_USER,
  payload: decoded,
  userProfile: user,
});

export const loginUser = async (user, dispatch) => {
  try {
    const response = await fetch(`${baseURL}users/login`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(user),
    });

    const data = await response.json();
    if (!response.ok || !data?.token) {
      throw new Error(data?.message || "Invalid credentials");
    }

    const decoded = jwtDecode(data.token);
    await AsyncStorage.setItem("jwt", data.token);
    await AsyncStorage.setItem(
      "userProfile",
      JSON.stringify({
        userId: data.userId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        birthday: data.birthday,
        address: data.address,
        avatar: data.avatar,
        isAdmin: data.isAdmin,
      })
    );

    dispatch(
      setCurrentUser(decoded, {
        userId: data.userId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        birthday: data.birthday,
        address: data.address,
        avatar: data.avatar,
        isAdmin: data.isAdmin,
      })
    );

    Toast.show({
      type: "success",
      text1: "Login successful",
      text2: "Welcome back",
      topOffset: 60,
    });
  } catch (error) {
    Toast.show({
      type: "error",
      text1: "Login failed",
      text2: error?.message || "Please try again",
      topOffset: 60,
    });
  }
};

export const logoutUser = async (dispatch) => {
  await AsyncStorage.removeItem("jwt");
  await AsyncStorage.removeItem("userProfile");
  dispatch(setCurrentUser({}));
};