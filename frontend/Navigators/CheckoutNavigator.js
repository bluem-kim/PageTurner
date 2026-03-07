import React from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";

import Checkout from "../Screens/Cart/Checkout/Checkout";
import Confirm from "../Screens/Cart/Checkout/Confirm";

const Tab = createMaterialTopTabNavigator();

const CheckoutNavigator = () => (
  <Tab.Navigator>
    <Tab.Screen name="Shipping" component={Checkout} />
    <Tab.Screen name="Confirm" component={Confirm} />
  </Tab.Navigator>
);

export default CheckoutNavigator;