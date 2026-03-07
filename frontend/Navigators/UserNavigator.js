import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useContext } from "react";

import Login from "../Screens/User/Login";
import Register from "../Screens/User/Register";
import UserProfile from "../Screens/User/UserProfile";
import MyOrders from "../Screens/User/MyOrders";
import MyReviews from "../Screens/User/MyReviews";
import EditProfile from "../Screens/User/EditProfile";
import ChangePassword from "../Screens/User/ChangePassword";
import ReviewProduct from "../Screens/User/ReviewProduct";
import AuthGlobal from "../Context/Store/AuthGlobal";

const Stack = createStackNavigator();

const UserNavigator = () => {
  const authContext = useContext(AuthGlobal);
  const isAuthenticated = Boolean(authContext?.stateUser?.isAuthenticated);

  return (
  <Stack.Navigator initialRouteName={isAuthenticated ? "User Profile" : "Login"}>
    <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
    <Stack.Screen
      name="Register"
      component={Register}
      options={{ headerShown: false }}
    />
    <Stack.Screen name="User Profile" component={UserProfile} />
    <Stack.Screen name="My Orders" component={MyOrders} />
    <Stack.Screen name="My Reviews" component={MyReviews} />
    <Stack.Screen name="Edit Profile" component={EditProfile} />
    <Stack.Screen name="Change Password" component={ChangePassword} />
    <Stack.Screen name="Review Product" component={ReviewProduct} />
  </Stack.Navigator>
  );
};

export default UserNavigator;