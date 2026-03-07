import React, { useMemo, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSelector } from "react-redux";
import Toast from "react-native-toast-message";

import EasyButton from "../../../Shared/StyledComponents/EasyButton";
import { SHIPPING_REGION_OPTIONS, getShippingFee } from "../../../utils/shipping";

const Checkout = ({ navigation }) => {
  const cartItems = useSelector((state) => state.cartItems);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [country, setCountry] = useState("");
  const [phone, setPhone] = useState("");
  const [shippingRegion, setShippingRegion] = useState("luzon");
  const shippingFee = getShippingFee(shippingRegion);
  const subtotal = cartItems.reduce((sum, item) => sum + Number(item.price || 0), 0);
  const total = subtotal + shippingFee;

  const order = useMemo(
    () => ({
      shippingAddress1: address,
      city,
      zip,
      country,
      phone,
      shippingRegion,
      shippingFee,
      subtotal,
      total,
      orderItems: cartItems,
      status: "3",
      dateOrdered: new Date().toISOString(),
    }),
    [address, city, zip, country, phone, shippingRegion, shippingFee, subtotal, total, cartItems]
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Shipping Address</Text>
      <TextInput style={styles.input} placeholder="Phone" value={phone} onChangeText={setPhone} />
      <TextInput
        style={styles.input}
        placeholder="Address"
        value={address}
        onChangeText={setAddress}
      />
      <TextInput style={styles.input} placeholder="City" value={city} onChangeText={setCity} />
      <TextInput style={styles.input} placeholder="Zip" value={zip} onChangeText={setZip} />
      <TextInput
        style={styles.input}
        placeholder="Country"
        value={country}
        onChangeText={setCountry}
      />

      <Text style={styles.sectionTitle}>Shipping Region</Text>
      <View style={styles.regionWrap}>
        {SHIPPING_REGION_OPTIONS.map((option) => {
          const active = shippingRegion === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[styles.regionChip, active && styles.regionChipActive]}
              onPress={() => setShippingRegion(option.value)}
            >
              <Text style={[styles.regionText, active && styles.regionTextActive]}>
                {option.label}
              </Text>
              <Text style={[styles.regionFee, active && styles.regionTextActive]}>+PHP {getShippingFee(option.value)}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.feeText}>Shipping Fee: PHP {shippingFee}</Text>
      <Text style={styles.totalText}>Order Total: PHP {total}</Text>

      <EasyButton
        primary
        large
        onPress={() => {
          if (!address || !city || !zip || !country || !phone) {
            Toast.show({
              type: "error",
              text1: "Missing fields",
              text2: "Please complete shipping details",
              topOffset: 60,
            });
            return;
          }
          navigation.navigate("Confirm", { order });
        }}
      >
        <Text style={styles.btn}>Continue</Text>
      </EasyButton>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, backgroundColor: "white" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 4,
    marginBottom: 8,
  },
  regionWrap: {
    marginBottom: 10,
  },
  regionChip: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    backgroundColor: "#f8f9fa",
  },
  regionChipActive: {
    borderColor: "#1f8a70",
    backgroundColor: "#eaf8f3",
  },
  regionText: {
    fontWeight: "700",
    color: "#333",
  },
  regionFee: {
    marginTop: 2,
    color: "#666",
  },
  regionTextActive: {
    color: "#1f8a70",
  },
  feeText: {
    color: "#495057",
    marginBottom: 4,
  },
  totalText: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  btn: { color: "white", fontWeight: "700" },
});

export default Checkout;