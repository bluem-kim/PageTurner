import React from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useDispatch } from "react-redux";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

import EasyButton from "../../../Shared/StyledComponents/EasyButton";
import { clearCart, removeSelectedFromCart } from "../../../Redux/Actions/cartActions";
import baseURL from "../../../assets/common/baseurl";
import { formatPHP } from "../../../utils/currency";
import { getShippingFee } from "../../../utils/shipping";

const Confirm = ({ route, navigation }) => {
  const dispatch = useDispatch();
  const order = route.params?.order;

  const total = (order?.orderItems || []).reduce(
    (sum, item) => sum + Number(item.price || 0),
    0
  );
  const shippingFee = Number(order?.shippingFee ?? getShippingFee(order?.shippingRegion));
  const grandTotal = total + shippingFee;

  const placeOrder = async () => {
    try {
      const token = await AsyncStorage.getItem("jwt");
      if (!token) {
        Toast.show({
          type: "error",
          text1: "Please login first",
          text2: "Authentication is required",
          topOffset: 60,
        });
        return;
      }

      // Convert cart lines into order items with quantity per product id.
      const grouped = (order?.orderItems || []).reduce((acc, item) => {
        const productId = item.id || item._id;
        if (!productId) return acc;
        if (!acc[productId]) {
          acc[productId] = { quantity: 0, product: productId };
        }
        acc[productId].quantity += 1;
        return acc;
      }, {});

      const payload = {
        orderItems: Object.values(grouped),
        shippingAddress1: order?.shippingAddress1,
        shippingAddress2: "",
        city: order?.city,
        zip: order?.zip,
        country: order?.country,
        phone: order?.phone,
        shippingRegion: order?.shippingRegion,
        shippingFee,
        status: "3",
      };

      await axios.post(`${baseURL}orders`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const lineIds = (order?.orderItems || [])
        .map((item) => item?.cartLineId)
        .filter(Boolean);

      if (lineIds.length) {
        dispatch(removeSelectedFromCart(lineIds));
      } else {
        dispatch(clearCart());
      }
      Toast.show({
        type: "success",
        text1: "Order placed",
        text2: "Saved successfully",
        topOffset: 60,
      });
      navigation.navigate("Cart Home");
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Order failed",
        text2: error?.response?.data?.message || "Please try again",
        topOffset: 60,
      });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Order Summary</Text>
      <Text style={styles.meta}>Address: {order?.shippingAddress1}</Text>
      <Text style={styles.meta}>
        {order?.city}, {order?.country} {order?.zip}
      </Text>
      <Text style={styles.meta}>Region: {String(order?.shippingRegion || "").toUpperCase()}</Text>

      <FlatList
        style={{ marginTop: 10 }}
        data={order?.orderItems || []}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={{ flex: 1 }}>{item.name}</Text>
            <Text>{formatPHP(item.price)}</Text>
          </View>
        )}
      />

      <Text style={styles.meta}>Subtotal: {formatPHP(total)}</Text>
      <Text style={styles.meta}>Shipping Fee: {formatPHP(shippingFee)}</Text>
      <Text style={styles.total}>Total: {formatPHP(grandTotal)}</Text>
      <EasyButton primary large onPress={placeOrder}>
        <Text style={styles.btn}>Place Order</Text>
      </EasyButton>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, backgroundColor: "white" },
  title: { fontSize: 22, fontWeight: "700" },
  meta: { color: "#495057", marginTop: 3 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderColor: "#f1f1f1",
    paddingVertical: 8,
  },
  total: { fontSize: 20, fontWeight: "700", marginVertical: 12 },
  btn: { color: "white", fontWeight: "700" },
});

export default Confirm;