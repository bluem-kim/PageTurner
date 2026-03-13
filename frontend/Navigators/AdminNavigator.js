import React from "react";
import { createStackNavigator } from "@react-navigation/stack";

import AdminPanel from "../Screens/Admin/AdminPanel";
import Products from "../Screens/Admin/Products";
import ProductForm from "../Screens/Admin/ProductForm";
import Categories from "../Screens/Admin/Categories";
import Orders from "../Screens/Admin/Orders";
import Users from "../Screens/Admin/Users";
import Reviews from "../Screens/Admin/Reviews";

const Stack = createStackNavigator();

const AdminNavigator = () => (
  <Stack.Navigator initialRouteName="Admin Panel">
    <Stack.Screen name="Admin Panel" component={AdminPanel} />
    <Stack.Screen name="Product Management" component={Products} />
    <Stack.Screen name="Product Form" component={ProductForm} />
    <Stack.Screen name="Genres" component={Categories} />
    <Stack.Screen name="Order Management" component={Orders} />
    <Stack.Screen name="User Management" component={Users} />
    <Stack.Screen name="Review Management" component={Reviews} />
  </Stack.Navigator>
);

export default AdminNavigator;
