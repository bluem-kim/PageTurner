import React from "react";
import { Dimensions, Image, StyleSheet, Text, View } from "react-native";

import EasyButton from "../../Shared/StyledComponents/EasyButton";
import { formatPHP } from "../../utils/currency";

const { width } = Dimensions.get("window");

const ProductCard = ({ item, onAdd, onDetails }) => {
  return (
    <View style={styles.container}>
      <Image
        style={styles.image}
        resizeMode="contain"
        source={{
          uri:
            item.image ||
            "https://cdn.pixabay.com/photo/2012/04/01/17/29/box-23649_960_720.png",
        }}
      />
      <Text style={styles.title} numberOfLines={1}>
        {item.name}
      </Text>
      <Text style={styles.brand}>{item.author || item.brand}</Text>
      <Text style={styles.price}>{formatPHP(item.price)}</Text>
      <View style={styles.actionsRow}>
        <EasyButton primary medium onPress={() => onAdd(item)}>
          <Text style={styles.buttonText}>Add</Text>
        </EasyButton>
        <EasyButton secondary medium onPress={onDetails}>
          <Text style={styles.buttonText}>Book Details</Text>
        </EasyButton>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: width / 2 - 18,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    width: "100%",
    height: 120,
    marginBottom: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
  },
  brand: {
    color: "#6c757d",
    marginVertical: 2,
  },
  price: {
    fontWeight: "700",
    fontSize: 18,
    color: "#fb8500",
  },
  buttonText: {
    color: "white",
    fontWeight: "700",
  },
  actionsRow: {
    marginTop: 6,
    alignItems: "center",
  },
});

export default ProductCard;