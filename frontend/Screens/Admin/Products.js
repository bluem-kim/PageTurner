import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import Toast from "react-native-toast-message";

import EasyButton from "../../Shared/StyledComponents/EasyButton";
import { deleteProduct as deleteProductAction, fetchProducts } from "../../Redux/Actions/productActions";
import { formatPHP } from "../../utils/currency";

const Products = ({ navigation }) => {
  const dispatch = useDispatch();
  const { items: products, loading, error } = useSelector((state) => state.products);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        try {
          await dispatch(fetchProducts());
        } catch (error) {
          Toast.show({
            type: "error",
            text1: "Failed to load products",
            text2: "Check server connection",
            topOffset: 60,
          });
        }
      };

      load();

      return undefined;
    }, [dispatch])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await dispatch(fetchProducts());
    } finally {
      setRefreshing(false);
    }
  };

  const deleteProduct = async (item) => {
    try {
      await dispatch(deleteProductAction(item.id || item._id));
      Toast.show({
        type: "success",
        text1: "Product deleted",
        topOffset: 60,
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Delete failed",
        text2: error?.response?.data?.message || "Please try again",
        topOffset: 60,
      });
    }
  };

  useEffect(() => {
    if (!error) return;
    Toast.show({
      type: "error",
      text1: "Failed to load products",
      text2: error,
      topOffset: 60,
    });
  }, [error]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1f8a70" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <EasyButton secondary medium onPress={() => navigation.navigate("Categories")}>
          <Text style={styles.btnText}>Genres</Text>
        </EasyButton>
        <EasyButton secondary medium onPress={() => navigation.navigate("Orders")}>
          <Text style={styles.btnText}>Orders</Text>
        </EasyButton>
        <EasyButton primary medium onPress={() => navigation.navigate("Product Form")}>
          <Text style={styles.btnText}>Add Product</Text>
        </EasyButton>
        <EasyButton secondary medium onPress={() => navigation.navigate("Admin Profile")}>
          <Text style={styles.btnText}>Profile</Text>
        </EasyButton>
      </View>

      <FlatList
        data={products}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        keyExtractor={(item) => item.id || item._id}
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle}>{item.name}</Text>
              <Text style={styles.itemMeta}>Author: {item.author || item.brand || "N/A"}</Text>
              <Text style={styles.itemMeta}>Price: {formatPHP(item.price)}</Text>
              <Text style={styles.itemMeta}>Stock: {item.countInStock ?? 0}</Text>
            </View>
            <View>
              <EasyButton
                secondary
                medium
                onPress={() => navigation.navigate("Product Form", { item })}
              >
                <Text style={styles.btnText}>Edit</Text>
              </EasyButton>
              <EasyButton danger medium onPress={() => deleteProduct(item)}>
                <Text style={styles.btnText}>Delete</Text>
              </EasyButton>
            </View>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white", padding: 12 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  topRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 10,
  },
  itemCard: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#ececec",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    backgroundColor: "#fafafa",
  },
  itemTitle: { fontWeight: "700", fontSize: 16 },
  itemMeta: { color: "#495057" },
  btnText: { color: "white", fontWeight: "700" },
});

export default Products;
