import React from "react";
import { createStackNavigator } from "@react-navigation/stack";

import ProductContainer from "../Screens/Product/ProductContainer";
import SingleProduct from "../Screens/Product/SingleProduct";

const Stack = createStackNavigator();

const HomeNavigator = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="Home"
      component={ProductContainer}
      options={{ headerShown: false }}
    />
    <Stack.Screen name="Product Detail" component={SingleProduct} />
  </Stack.Navigator>
);

export default HomeNavigator;