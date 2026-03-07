import React, { useContext } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";

import EasyButton from "../../Shared/StyledComponents/EasyButton";
import { clearCart, removeFromCart } from "../../Redux/Actions/cartActions";
import AuthGlobal from "../../Context/Store/AuthGlobal";
import { formatPHP } from "../../utils/currency";

const Cart = ({ navigation }) => {
  const cartItems = useSelector((state) => state.cartItems);
  const dispatch = useDispatch();
  const context = useContext(AuthGlobal);

  const total = cartItems.reduce((sum, item) => sum + Number(item.price || 0), 0);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Cart</Text>

      {cartItems.length ? (
        <FlatList
          data={cartItems}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          renderItem={({ item }) => (
            <View style={styles.row}>
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
        <View style={styles.actions}>
          <EasyButton danger medium onPress={() => dispatch(clearCart())}>
            <Text style={styles.btnText}>Clear</Text>
          </EasyButton>
          {context?.stateUser?.isAuthenticated ? (
            <EasyButton secondary medium onPress={() => navigation.navigate("Checkout") }>
              <Text style={styles.btnText}>Checkout</Text>
            </EasyButton>
          ) : (
            <EasyButton secondary medium onPress={() => navigation.navigate("User", { screen: "Login" })}>
              <Text style={styles.btnText}>Login First</Text>
            </EasyButton>
          )}
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
  name: { fontWeight: "700" },
  meta: { color: "#6c757d" },
  price: { marginHorizontal: 10, fontWeight: "700" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  bottom: { borderTopWidth: 1, borderColor: "#eee", paddingTop: 10 },
  total: { fontSize: 20, fontWeight: "700", marginBottom: 8 },
  actions: { flexDirection: "row", justifyContent: "space-between" },
  btnText: { color: "white", fontWeight: "700" },
});

export default Cart;