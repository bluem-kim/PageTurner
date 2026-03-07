import React from "react";
import { createStackNavigator } from "@react-navigation/stack";

import Products from "../Screens/Admin/Products";
import ProductForm from "../Screens/Admin/ProductForm";
import Categories from "../Screens/Admin/Categories";
import Orders from "../Screens/Admin/Orders";
import ProfileEdit from "../Screens/Admin/ProfileEdit";
import ChangePassword from "../Screens/Admin/ChangePassword";

const Stack = createStackNavigator();

const AdminNavigator = () => (
  <Stack.Navigator>
    <Stack.Screen name="Admin Products" component={Products} />
    <Stack.Screen name="Product Form" component={ProductForm} />
    <Stack.Screen name="Categories" component={Categories} />
    <Stack.Screen name="Orders" component={Orders} />
    <Stack.Screen name="Admin Profile" component={ProfileEdit} />
    <Stack.Screen name="Change Password" component={ChangePassword} />
  </Stack.Navigator>
);

export default AdminNavigator;
