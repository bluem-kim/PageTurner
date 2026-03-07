import React, { useContext } from "react";
import { Text } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSelector } from "react-redux";

import HomeNavigator from "./HomeNavigator";
import CartNavigator from "./CartNavigator";
import UserNavigator from "./UserNavigator";
import AdminNavigator from "./AdminNavigator";
import AuthGlobal from "../Context/Store/AuthGlobal";

const Tab = createBottomTabNavigator();

const Main = () => {
  const cartItems = useSelector((state) => state.cartItems);
  const authContext = useContext(AuthGlobal);
  const profile = authContext?.stateUser?.userProfile || {};
  const userPayload = authContext?.stateUser?.user || {};
  const isAdmin = Boolean(profile.isAdmin || userPayload.isAdmin);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen name="Shop" component={HomeNavigator} />
      <Tab.Screen
        name="Cart"
        component={CartNavigator}
        options={{
          tabBarBadge: cartItems.length ? cartItems.length : undefined,
        }}
      />
      <Tab.Screen
        name="User"
        component={UserNavigator}
        options={{ tabBarLabel: ({ color }) => <Text style={{ color }}>User</Text> }}
      />
      {isAdmin ? <Tab.Screen name="Admin" component={AdminNavigator} /> : null}
    </Tab.Navigator>
  );
};

export default Main;