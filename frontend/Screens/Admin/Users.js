import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Toast from "react-native-toast-message";

import EasyButton from "../../Shared/StyledComponents/EasyButton";
import baseURL from "../../assets/common/baseurl";
import { buildListPdfHtml, exportPdfFromHtml } from "../../utils/pdfExport";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("active");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("jwt");
      const response = await axios.get(`${baseURL}users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data || []);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Failed to load users",
        text2: error?.response?.data?.message || "Please try again",
        topOffset: 60,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUsers();
      return undefined;
    }, [loadUsers])
  );

  const updateUserInList = (updatedUser) => {
    setUsers((prev) =>
      (prev || []).map((item) => {
        const currentId = item.id || item._id;
        const updatedId = updatedUser.id || updatedUser._id;
        if (String(currentId) !== String(updatedId)) return item;
        return { ...item, ...updatedUser };
      })
    );
  };

  const toggleRole = async (user) => {
    try {
      const token = await AsyncStorage.getItem("jwt");
      const nextRole = !Boolean(user.isAdmin);
      const response = await axios.put(
        `${baseURL}users/${user.id || user._id}/role`,
        { isAdmin: nextRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      updateUserInList(response.data);
      Toast.show({
        type: "success",
        text1: `${response.data.name} is now ${response.data.isAdmin ? "Admin" : "User"}`,
        topOffset: 60,
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Role update failed",
        text2: error?.response?.data?.message || "Please try again",
        topOffset: 60,
      });
    }
  };

  const toggleStatus = async (user) => {
    try {
      const token = await AsyncStorage.getItem("jwt");
      const nextStatus = !Boolean(user.isActive);
      const response = await axios.put(
        `${baseURL}users/${user.id || user._id}/status`,
        { isActive: nextStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      updateUserInList(response.data);
      Toast.show({
        type: "success",
        text1: `${response.data.name} is now ${response.data.isActive ? "Active" : "Deactivated"}`,
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

  const bulkUpdateStatus = async (isActive) => {
    const targets = filteredUsers.filter((item) => Boolean(item?.isActive) !== Boolean(isActive));
    if (!targets.length) {
      Toast.show({
        type: "info",
        text1: "No matching users",
        topOffset: 60,
      });
      return;
    }

    try {
      const token = await AsyncStorage.getItem("jwt");
      let success = 0;

      for (const user of targets) {
        try {
          const response = await axios.put(
            `${baseURL}users/${user.id || user._id}/status`,
            { isActive },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          updateUserInList(response.data);
          success += 1;
        } catch (error) {
          // Continue processing remaining users even if one update fails.
        }
      }

      Toast.show({
        type: "success",
        text1: isActive ? "Bulk restore done" : "Bulk archive done",
        text2: `${success} users updated`,
        topOffset: 60,
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Bulk update failed",
        text2: error?.message || "Please try again",
        topOffset: 60,
      });
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  };

  const filteredUsers = (users || []).filter((item) => {
    const archived = !Boolean(item?.isActive);
    const matchesTab = activeTab === "archived" ? archived : !archived;
    if (!matchesTab) return false;

    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;

    const name = String(item?.name || "").toLowerCase();
    const email = String(item?.email || "").toLowerCase();
    const role = item?.isAdmin ? "admin" : "user";
    const status = item?.isActive ? "active" : "deactivated";

    return name.includes(q) || email.includes(q) || role.includes(q) || status.includes(q);
  });

  const exportUserListPdf = async () => {
    try {
      const rows = (users || []).map((item, index) => [
        index + 1,
        item?.name || "Unnamed",
        item?.email || "No email",
        item?.isAdmin ? "Admin" : "User",
        item?.isActive ? "Active" : "Deactivated",
      ]);

      const html = buildListPdfHtml({
        title: "PageTurner User Records",
        summaryLines: [{ label: "Total records:", value: String(rows.length) }],
        headers: ["#", "Name", "Email", "Role", "Status"],
        rows,
      });

      const result = await exportPdfFromHtml(html, {
        fileName: "PageTurnerUserRecords",
        dialogTitle: "Export user records",
      });

      Toast.show({
        type: "success",
        text1: "User records exported",
        text2: result.shared ? "PDF ready to share" : result.uri,
        topOffset: 60,
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Export failed",
        text2: error?.message || "Please try again",
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
      <Text style={styles.title}>User Management</Text>
      <View style={styles.exportRow}>
        <TouchableOpacity style={styles.exportBtn} onPress={exportUserListPdf}>
          <Text style={styles.exportBtnText}>Export PDF</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search users"
        style={styles.searchInput}
      />

      <View style={styles.tabRow}>
        <EasyButton
          primary={activeTab === "active"}
          secondary={activeTab !== "active"}
          medium
          onPress={() => setActiveTab("active")}
        >
          <Text style={styles.btnText}>
            Active ({(users || []).filter((item) => item?.isActive).length})
          </Text>
        </EasyButton>
        <EasyButton
          primary={activeTab === "archived"}
          secondary={activeTab !== "archived"}
          medium
          onPress={() => setActiveTab("archived")}
        >
          <Text style={styles.btnText}>
            Deactivated ({(users || []).filter((item) => !item?.isActive).length})
          </Text>
        </EasyButton>
      </View>

      <View style={styles.bulkRow}>
        <EasyButton danger medium onPress={() => bulkUpdateStatus(false)}>
          <Text style={styles.btnText}>Archive Visible</Text>
        </EasyButton>
        <EasyButton secondary medium onPress={() => bulkUpdateStatus(true)}>
          <Text style={styles.btnText}>Restore Visible</Text>
        </EasyButton>
      </View>

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id || item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.emptyText}>No users in this tab.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.name || "Unnamed"}</Text>
            <Text style={styles.meta}>{item.email || "No email"}</Text>
            <Text style={styles.meta}>Role: {item.isAdmin ? "Admin" : "User"}</Text>
            <Text style={styles.meta}>Status: {item.isActive ? "Active" : "Deactivated"}</Text>

            <View style={styles.actionsRow}>
              <EasyButton secondary medium onPress={() => toggleRole(item)}>
                <Text style={styles.btnText}>{item.isAdmin ? "Set User" : "Set Admin"}</Text>
              </EasyButton>
              <EasyButton danger medium onPress={() => toggleStatus(item)}>
                <Text style={styles.btnText}>{item.isActive ? "Deactivate" : "Activate"}</Text>
              </EasyButton>
            </View>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    padding: 12,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 6,
  },
  exportRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 10,
  },
  exportBtn: {
    backgroundColor: "#0b3954",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  exportBtnText: {
    color: "white",
    fontWeight: "700",
    fontSize: 12,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 44,
    marginBottom: 10,
  },
  tabRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 10,
  },
  bulkRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 10,
  },
  card: {
    borderWidth: 1,
    borderColor: "#ececec",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    backgroundColor: "#fafafa",
  },
  name: {
    fontWeight: "700",
    fontSize: 16,
  },
  meta: {
    color: "#495057",
    marginTop: 2,
  },
  actionsRow: {
    marginTop: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  btnText: {
    color: "white",
    fontWeight: "700",
  },
  emptyText: {
    textAlign: "center",
    color: "#6c757d",
    marginTop: 25,
  },
});

export default Users;
