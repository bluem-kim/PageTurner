import React, { useContext } from "react";
import { Image, Text } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSelector } from "react-redux";

import HomeNavigator from "./HomeNavigator";
import CartNavigator from "./CartNavigator";
import UserNavigator from "./UserNavigator";
import AdminNavigator from "./AdminNavigator";
import Dashboard from "../Screens/Admin/Dashboard";
import AuthGlobal from "../Context/Store/AuthGlobal";

const Tab = createBottomTabNavigator();
const FALLBACK_AVATAR =
  "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png";

const Main = () => {
  const cartItems = useSelector((state) => state.cartItems);
  const authContext = useContext(AuthGlobal);
  const profile = authContext?.stateUser?.userProfile || {};
  const userPayload = authContext?.stateUser?.user || {};
  const isAuthenticated = Boolean(authContext?.stateUser?.isAuthenticated);
  const isAdmin = Boolean(profile.isAdmin || userPayload.isAdmin);
  const avatarUri = profile.avatar || userPayload.avatar || FALLBACK_AVATAR;

  return (
    <Tab.Navigator
      initialRouteName={isAdmin ? "Admin" : "Shop"}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      {isAdmin ? (
        <Tab.Screen
          name="Home"
          component={Dashboard}
          options={{ tabBarLabel: ({ color }) => <Text style={{ color }}>Home</Text> }}
        />
      ) : (
        <Tab.Screen name="Shop" component={HomeNavigator} />
      )}

      {isAdmin ? (
        <Tab.Screen
          name="Admin"
          component={AdminNavigator}
          listeners={({ navigation }) => ({
            tabPress: () => {
              navigation.navigate("Admin", { screen: "Admin Panel" });
            },
          })}
          options={{
            tabBarLabel: ({ color }) => <Text style={{ color }}>Admin</Text>,
            popToTopOnBlur: true,
          }}
        />
      ) : (
        <Tab.Screen
          name="Cart"
          component={CartNavigator}
          listeners={({ navigation }) => ({
            tabPress: (e) => {
              if (isAuthenticated) return;
              e.preventDefault();
              navigation.navigate("User", { screen: "Login" });
            },
          })}
          options={{
            tabBarBadge: cartItems.length ? cartItems.length : undefined,
          }}
        />
      )}

      {isAdmin ? (
        <Tab.Screen
          name="Profile"
          component={UserNavigator}
          options={{
            tabBarLabel: () => null,
            tabBarIcon: ({ focused }) => (
              <Image
                source={{ uri: avatarUri }}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  borderWidth: focused ? 2 : 1,
                  borderColor: focused ? "#1f8a70" : "#c8d0d8",
                }}
              />
            ),
          }}
        />
      ) : (
        <Tab.Screen
          name="User"
          component={UserNavigator}
          options={{ tabBarLabel: ({ color }) => <Text style={{ color }}>User</Text> }}
        />
      )}
    </Tab.Navigator>
  );
};

export default Main;