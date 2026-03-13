import React from "react";
import { StyleSheet, Text, View } from "react-native";

import EasyButton from "../../Shared/StyledComponents/EasyButton";

const AdminPanel = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        <EasyButton primary large onPress={() => navigation.navigate("Product Management")}>
          <Text style={styles.btnText}>Products</Text>
        </EasyButton>

        <EasyButton secondary large onPress={() => navigation.navigate("Order Management")}>
          <Text style={styles.btnText}>Orders</Text>
        </EasyButton>

        <EasyButton secondary large onPress={() => navigation.navigate("Genres")}>
          <Text style={styles.btnText}>Genres</Text>
        </EasyButton>

        <EasyButton danger large onPress={() => navigation.navigate("User Management")}>
          <Text style={styles.btnText}>Users</Text>
        </EasyButton>

        <EasyButton secondary large onPress={() => navigation.navigate("Review Management")}>
          <Text style={styles.btnText}>Reviews</Text>
        </EasyButton>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fbfd",
    padding: 16,
    justifyContent: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  btnText: {
    color: "white",
    fontWeight: "700",
  },
});

export default AdminPanel;
