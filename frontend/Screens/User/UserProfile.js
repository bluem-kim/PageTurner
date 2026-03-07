import React, { useContext } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import AuthGlobal from "../../Context/Store/AuthGlobal";
import { logoutUser } from "../../Context/Actions/Auth.actions";
import EasyButton from "../../Shared/StyledComponents/EasyButton";

const FALLBACK_AVATAR =
  "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png";

const UserProfile = ({ navigation }) => {
  const context = useContext(AuthGlobal);
  const user = context?.stateUser?.user || {};
  const profile = context?.stateUser?.userProfile || {};

  const signOut = async () => {
    await logoutUser(context.dispatch);
    navigation.navigate("Login");
  };

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: profile.avatar || FALLBACK_AVATAR }}
        style={styles.avatar}
      />
      <Text style={styles.name}>{profile.name || user.name || "Guest"}</Text>
      <Text style={styles.meta}>{profile.email || user.email || "No email"}</Text>

      <View style={styles.actionsRow}>
        <EasyButton secondary medium onPress={() => navigation.navigate("Edit Profile")}>
          <Text style={styles.btn}>Edit Profile</Text>
        </EasyButton>
        <EasyButton secondary medium onPress={() => navigation.navigate("Change Password")}>
          <Text style={styles.btn}>Change Password</Text>
        </EasyButton>
        <EasyButton secondary medium onPress={() => navigation.navigate("My Orders")}>
          <Text style={styles.btn}>My Orders</Text>
        </EasyButton>
        <EasyButton secondary medium onPress={() => navigation.navigate("My Reviews")}>
          <Text style={styles.btn}>My Reviews</Text>
        </EasyButton>
      </View>

      <EasyButton danger large onPress={signOut}>
        <Text style={styles.btn}>Sign Out</Text>
      </EasyButton>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    backgroundColor: "white",
  },
  name: { fontSize: 26, fontWeight: "700" },
  avatar: {
    width: 98,
    height: 98,
    borderRadius: 49,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#f1f3f5",
  },
  meta: { marginVertical: 10, color: "#6c757d" },
  actionsRow: {
    width: "100%",
    marginBottom: 10,
    alignItems: "center",
  },
  btn: { color: "white", fontWeight: "700" },
});

export default UserProfile;