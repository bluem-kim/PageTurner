import React, { useCallback, useEffect } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import Toast from "react-native-toast-message";

import EasyButton from "../../Shared/StyledComponents/EasyButton";
import { fetchAdminOrders, updateAdminOrderStatus } from "../../Redux/Actions/orderActions";
import { formatPHP } from "../../utils/currency";

const STATUS = {
  "3": "Pending",
  "2": "Shipped",
  "1": "Delivered",
  "0": "Cancelled",
};

const statusOptions = [
  { code: "3", label: "Pending" },
  { code: "2", label: "Shipped" },
  { code: "0", label: "Cancelled" },
];

const Orders = () => {
  const dispatch = useDispatch();
  const { adminOrders: orders, loadingAdmin: loading, errorAdmin } = useSelector(
    (state) => state.orders
  );

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      const load = async () => {
        try {
          await dispatch(fetchAdminOrders());
        } catch (error) {
          Toast.show({
            type: "error",
            text1: "Failed to load orders",
            text2: error?.response?.data?.message || "Please try again",
            topOffset: 60,
          });
        } finally {
          if (mounted) {
            // no-op, loading handled by redux
          }
        }
      };

      load();

      return () => {
        mounted = false;
      };
    }, [dispatch])
  );

  useEffect(() => {
    if (!errorAdmin) return;
    Toast.show({
      type: "error",
      text1: "Failed to load orders",
      text2: errorAdmin,
      topOffset: 60,
    });
  }, [errorAdmin]);

  const updateStatus = async (orderId, status) => {
    try {
      await dispatch(updateAdminOrderStatus(orderId, status));
      Toast.show({
        type: "success",
        text1: `Order marked ${STATUS[status]}`,
        topOffset: 60,
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Status update failed",
        text2: error?.response?.data?.message || "Please try again",
        topOffset: 60,
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1f8a70" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>All Orders</Text>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id || item._id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.idText}>Order: {item.id || item._id}</Text>
            <Text style={styles.meta}>Customer: {item.user?.name || "N/A"}</Text>
            <Text style={styles.meta}>Status: {STATUS[item.status] || "Pending"}</Text>
            <Text style={styles.meta}>Total: {formatPHP(item.totalPrice)}</Text>
            <Text style={styles.meta}>
              {item.city}, {item.country} {item.zip}
            </Text>

            <View style={styles.actionsRow}>
              {statusOptions.map((opt) => (
                <EasyButton
                  key={`${item.id || item._id}-${opt.code}`}
                  secondary
                  medium
                  onPress={() => updateStatus(item.id || item._id, opt.code)}
                >
                  <Text style={styles.btnText}>{opt.label}</Text>
                </EasyButton>
              ))}
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
  title: { fontSize: 22, fontWeight: "700", marginBottom: 10 },
  card: {
    borderWidth: 1,
    borderColor: "#ececec",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    backgroundColor: "#fafafa",
  },
  idText: { fontWeight: "700", marginBottom: 2 },
  meta: { color: "#495057" },
  actionsRow: {
    marginTop: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  btnText: { color: "white", fontWeight: "700" },
});

export default Orders;
