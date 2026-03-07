import React, { useCallback, useEffect } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import Toast from "react-native-toast-message";

import EasyButton from "../../Shared/StyledComponents/EasyButton";
import {
  fetchUserOrders,
  userCancelOrder,
  userConfirmDelivered,
} from "../../Redux/Actions/orderActions";
import { formatPHP } from "../../utils/currency";

const STATUS = {
  "1": "Delivered",
  "2": "Shipped",
  "3": "Pending",
  "0": "Cancelled",
};

const MyOrders = ({ navigation }) => {
  const dispatch = useDispatch();
  const { userOrders: orders, loadingUser: loading, errorUser } = useSelector(
    (state) => state.orders
  );

  useFocusEffect(
    useCallback(() => {
      const loadOrders = async () => {
        await dispatch(fetchUserOrders());
      };

      loadOrders();

      return undefined;
    }, [dispatch])
  );

  useEffect(() => {
    if (!errorUser) return;
    Toast.show({
      type: "error",
      text1: "Failed to load orders",
      text2: errorUser,
      topOffset: 60,
    });
  }, [errorUser]);

  const updateOrderStatus = async (orderId, action) => {
    try {
      if (action === "cancel") {
        await dispatch(userCancelOrder(orderId));
      } else {
        await dispatch(userConfirmDelivered(orderId));
      }

      Toast.show({
        type: "success",
        text1: action === "cancel" ? "Order cancelled" : "Order confirmed delivered",
        topOffset: 60,
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Action failed",
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
      <Text style={styles.title}>My Orders</Text>

      {orders.length ? (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id || item._id}
          contentContainerStyle={{ paddingBottom: 8 }}
          renderItem={({ item }) => (
            <View style={styles.orderCard}>
              <Text style={styles.orderText}>Order: {item.id || item._id}</Text>
              <Text style={styles.orderText}>Status: {STATUS[String(item.status)] || "Pending"}</Text>
              <Text style={styles.orderText}>Total: {formatPHP(item.totalPrice)}</Text>
              <Text style={styles.orderMeta}>
                {item.dateOrdered ? String(item.dateOrdered).split("T")[0] : ""}
              </Text>

              <View style={styles.orderActionsRow}>
                {String(item.status) === "3" ? (
                  <EasyButton danger medium onPress={() => updateOrderStatus(item.id || item._id, "cancel")}>
                    <Text style={styles.btn}>Cancel Order</Text>
                  </EasyButton>
                ) : null}
                {String(item.status) === "2" ? (
                  <EasyButton secondary medium onPress={() => updateOrderStatus(item.id || item._id, "deliver")}>
                    <Text style={styles.btn}>Confirm Delivered</Text>
                  </EasyButton>
                ) : null}
              </View>

              {String(item.status) === "1" ? (
                <View style={styles.reviewWrap}>
                  <Text style={styles.reviewTitle}>Review Purchased Items</Text>
                  {(item.orderItems || []).map((orderItem) => {
                    const product = orderItem?.product;
                    const productId = product?.id || product?._id;
                    if (!productId) return null;

                    return (
                      <View key={`${item.id || item._id}-${productId}`} style={styles.reviewRow}>
                        <Text style={styles.reviewText}>{product?.name || "Product"}</Text>
                        <EasyButton
                          secondary
                          medium
                          onPress={() =>
                            navigation.navigate("Review Product", {
                              product,
                              orderId: item.id || item._id,
                            })
                          }
                        >
                          <Text style={styles.btn}>Review</Text>
                        </EasyButton>
                      </View>
                    );
                  })}
                </View>
              ) : null}
            </View>
          )}
        />
      ) : (
        <Text style={styles.emptyText}>No orders yet.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    padding: 12,
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 8 },
  orderCard: {
    borderWidth: 1,
    borderColor: "#ececec",
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    backgroundColor: "#fafafa",
  },
  orderText: {
    fontWeight: "600",
  },
  orderMeta: {
    marginTop: 4,
    color: "#6c757d",
    fontSize: 12,
  },
  orderActionsRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 8,
  },
  reviewWrap: {
    marginTop: 8,
    borderTopWidth: 1,
    borderColor: "#e8e8e8",
    paddingTop: 8,
  },
  reviewTitle: {
    fontWeight: "700",
    marginBottom: 4,
  },
  reviewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  reviewText: {
    flex: 1,
    marginRight: 8,
  },
  emptyText: {
    color: "#6c757d",
    marginTop: 4,
  },
  btn: { color: "white", fontWeight: "700" },
});

export default MyOrders;
