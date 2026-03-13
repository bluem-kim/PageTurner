import React, { useContext, useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import Toast from "react-native-toast-message";

import EasyButton from "../../Shared/StyledComponents/EasyButton";
import {
  clearCart,
  removeFromCart,
  removeSelectedFromCart,
} from "../../Redux/Actions/cartActions";
import AuthGlobal from "../../Context/Store/AuthGlobal";
import { formatPHP } from "../../utils/currency";

const Cart = ({ navigation }) => {
  const cartItems = useSelector((state) => state.cartItems);
  const dispatch = useDispatch();
  const context = useContext(AuthGlobal);
  const [selectedIds, setSelectedIds] = useState([]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const selectedItems = useMemo(
    () => cartItems.filter((item) => selectedSet.has(item.cartLineId)),
    [cartItems, selectedSet]
  );

  const total = selectedItems.reduce((sum, item) => sum + Number(item.price || 0), 0);

  useEffect(() => {
    const available = new Set(cartItems.map((item) => item.cartLineId).filter(Boolean));
    setSelectedIds((prev) => prev.filter((id) => available.has(id)));
  }, [cartItems]);

  useEffect(() => {
    if (context?.stateUser?.isAuthenticated) return;
    navigation.navigate("User", { screen: "Login" });
  }, [context?.stateUser?.isAuthenticated, navigation]);

  const toggleSelected = (lineId) => {
    if (!lineId) return;
    setSelectedIds((prev) =>
      prev.includes(lineId) ? prev.filter((id) => id !== lineId) : [...prev, lineId]
    );
  };

  const selectAll = () => {
    setSelectedIds(cartItems.map((item) => item.cartLineId).filter(Boolean));
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  const removeSelected = () => {
    if (!selectedIds.length) {
      Toast.show({
        type: "info",
        text1: "No items selected",
        text2: "Select one or more items to remove",
        topOffset: 60,
      });
      return;
    }

    dispatch(removeSelectedFromCart(selectedIds));
    setSelectedIds([]);
    Toast.show({
      type: "success",
      text1: "Selected items removed",
      topOffset: 60,
    });
  };

  const checkoutSelected = () => {
    if (!selectedItems.length) {
      Toast.show({
        type: "info",
        text1: "No items selected",
        text2: "Select one or more items to checkout",
        topOffset: 60,
      });
      return;
    }

    if (context?.stateUser?.isAuthenticated) {
      navigation.navigate("Checkout", { selectedItems });
      return;
    }

    navigation.navigate("User", { screen: "Login" });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Cart</Text>

      {cartItems.length ? (
        <FlatList
          data={cartItems}
          keyExtractor={(item, index) => item.cartLineId || `${item.id}-${index}`}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Pressable
                onPress={() => toggleSelected(item.cartLineId)}
                style={[styles.checkbox, selectedSet.has(item.cartLineId) && styles.checkboxActive]}
              >
                {selectedSet.has(item.cartLineId) ? <Text style={styles.checkboxTick}>✓</Text> : null}
              </Pressable>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.meta}>{item.brand}</Text>
              </View>
              <Text style={styles.price}>{formatPHP(item.price)}</Text>
              <EasyButton danger onPress={() => dispatch(removeFromCart(item))}>
                <Text style={styles.btnText}>Remove</Text>
              </EasyButton>
            </View>
          )}
        />
      ) : (
        <View style={styles.center}>
          <Text>No items in cart</Text>
        </View>
      )}

      <View style={styles.bottom}>
        <Text style={styles.total}>Total: {formatPHP(total)}</Text>
        <Text style={styles.selectionMeta}>Selected: {selectedItems.length}</Text>
        <View style={styles.selectionActions}>
          <EasyButton secondary medium onPress={selectAll}>
            <Text style={styles.btnText}>Select All</Text>
          </EasyButton>
          <EasyButton secondary medium onPress={clearSelection}>
            <Text style={styles.btnText}>Clear Selection</Text>
          </EasyButton>
        </View>
        <View style={styles.actions}>
          <View style={styles.actionBtnWrap}>
            <EasyButton danger medium onPress={removeSelected}>
              <Text style={styles.btnText}>Remove Selected</Text>
            </EasyButton>
          </View>
          <View style={styles.actionBtnWrap}>
            <EasyButton
              danger
              medium
              onPress={() => {
                dispatch(clearCart());
                setSelectedIds([]);
              }}
            >
              <Text style={styles.btnText}>Clear Cart</Text>
            </EasyButton>
          </View>
          <View style={styles.actionBtnWrap}>
            <EasyButton secondary medium onPress={checkoutSelected}>
              <Text style={styles.btnText}>Checkout Selected</Text>
            </EasyButton>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white", padding: 12 },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 10 },
  row: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: "#c7c7c7",
    borderRadius: 6,
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
  },
  checkboxActive: {
    borderColor: "#1f8a70",
    backgroundColor: "#eaf8f3",
  },
  checkboxTick: {
    color: "#1f8a70",
    fontWeight: "700",
  },
  name: { fontWeight: "700" },
  meta: { color: "#6c757d" },
  price: { marginHorizontal: 10, fontWeight: "700" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  bottom: { borderTopWidth: 1, borderColor: "#eee", paddingTop: 10 },
  total: { fontSize: 20, fontWeight: "700", marginBottom: 8 },
  selectionMeta: { color: "#495057", marginBottom: 8 },
  selectionActions: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  actions: { flexDirection: "row", justifyContent: "space-between", flexWrap: "wrap" },
  actionBtnWrap: { marginBottom: 8, marginRight: 6 },
  btnText: { color: "white", fontWeight: "700" },
});

export default Cart;