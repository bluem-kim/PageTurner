import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import Toast from "react-native-toast-message";

import EasyButton from "../../Shared/StyledComponents/EasyButton";
import {
  fetchAdminOrders,
  updateAdminOrderArchive,
  updateAdminOrderStatus,
} from "../../Redux/Actions/orderActions";
import { formatPHP } from "../../utils/currency";
import { buildListPdfHtml, exportPdfFromHtml } from "../../utils/pdfExport";

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

const statusTabs = [
  { key: "all", label: "All" },
  { key: "3", label: "Pending" },
  { key: "2", label: "Shipped" },
  { key: "1", label: "Delivered" },
  { key: "archived", label: "Archived" },
];

const Orders = () => {
  const dispatch = useDispatch();
  const { adminOrders: orders, loadingAdmin: loading, errorAdmin } = useSelector(
    (state) => state.orders
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      const load = async () => {
        try {
          await dispatch(fetchAdminOrders({ includeArchived: true }));
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

  const toggleArchive = async (order) => {
    const orderId = order?.id || order?._id;
    const nextArchived = !Boolean(order?.isArchived);
    try {
      await dispatch(updateAdminOrderArchive(orderId, nextArchived));
      Toast.show({
        type: "success",
        text1: nextArchived ? "Order archived" : "Order restored",
        topOffset: 60,
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Archive update failed",
        text2: error?.response?.data?.message || "Please try again",
        topOffset: 60,
      });
    }
  };

  const bulkArchiveOrders = async (isArchived) => {
    const targets = filteredOrders.filter((item) => Boolean(item?.isArchived) !== Boolean(isArchived));
    if (!targets.length) {
      Toast.show({ type: "info", text1: "No matching orders", topOffset: 60 });
      return;
    }

    try {
      await Promise.all(
        targets.map((order) =>
          dispatch(updateAdminOrderArchive(order.id || order._id, isArchived)).catch(() => null)
        )
      );

      Toast.show({
        type: "success",
        text1: isArchived ? "Bulk archive done" : "Bulk restore done",
        text2: `${targets.length} orders processed`,
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

  const filteredOrders = (orders || []).filter((item) => {
    const isArchived = Boolean(item?.isArchived);
    const matchesStatus =
      activeTab === "all"
        ? !isArchived
        : activeTab === "archived"
        ? isArchived
        : !isArchived && String(item?.status) === activeTab;
    if (!matchesStatus) return false;

    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;

    const id = String(item?.id || item?._id || "").toLowerCase();
    const customer = String(item?.user?.name || "").toLowerCase();
    const city = String(item?.city || "").toLowerCase();
    const country = String(item?.country || "").toLowerCase();
    const status = String(STATUS[item?.status] || "Pending").toLowerCase();

    return (
      id.includes(q) ||
      customer.includes(q) ||
      city.includes(q) ||
      country.includes(q) ||
      status.includes(q)
    );
  });

  const exportOrderListPdf = async () => {
    try {
      const rows = (orders || []).map((item, index) => [
        index + 1,
        item?.id || item?._id || "N/A",
        item?.user?.name || "N/A",
        STATUS[item?.status] || "Pending",
        item?.isArchived ? "Archived" : "Active",
        formatPHP(item?.totalPrice || 0),
      ]);

      const html = buildListPdfHtml({
        title: "PageTurner Order Records",
        summaryLines: [{ label: "Total records:", value: String(rows.length) }],
        headers: ["#", "Order ID", "Customer", "Status", "State", "Total"],
        rows,
      });

      const result = await exportPdfFromHtml(html, {
        fileName: "PageTurnerOrderRecords",
        dialogTitle: "Export order records",
      });

      Toast.show({
        type: "success",
        text1: "Order records exported",
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
      <Text style={styles.title}>Order Management</Text>
      <View style={styles.exportRow}>
        <TouchableOpacity style={styles.exportBtn} onPress={exportOrderListPdf}>
          <Text style={styles.exportBtnText}>Export PDF</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.searchInput}
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search records"
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsWrap}
      >
        {statusTabs.map((tab) => {
          const active = activeTab === tab.key;
          const count =
            tab.key === "all"
              ? (orders || []).filter((item) => !item?.isArchived).length
              : tab.key === "archived"
              ? (orders || []).filter((item) => item?.isArchived).length
              : (orders || []).filter(
                  (item) => !item?.isArchived && String(item?.status) === tab.key
                ).length;

          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabChip, active && styles.tabChipActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                {tab.label} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.bulkRow}>
        <EasyButton danger medium onPress={() => bulkArchiveOrders(true)}>
          <Text style={styles.btnText}>Archive Visible</Text>
        </EasyButton>
        <EasyButton secondary medium onPress={() => bulkArchiveOrders(false)}>
          <Text style={styles.btnText}>Restore Visible</Text>
        </EasyButton>
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id || item._id}
        ListEmptyComponent={<Text style={styles.emptyText}>No orders found for this status.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.idText}>Order: {item.id || item._id}</Text>
            <Text style={styles.meta}>Customer: {item.user?.name || "N/A"}</Text>
            <Text style={styles.meta}>Status: {STATUS[item.status] || "Pending"}</Text>
            <Text style={styles.meta}>State: {item?.isArchived ? "Archived" : "Active"}</Text>
            <Text style={styles.meta}>Total: {formatPHP(item.totalPrice)}</Text>
            <Text style={styles.meta}>
              {item.city}, {item.country} {item.zip}
            </Text>

            <View style={styles.actionsRow}>
              <EasyButton danger medium onPress={() => toggleArchive(item)}>
                <Text style={styles.btnText}>{item?.isArchived ? "Unarchive" : "Archive"}</Text>
              </EasyButton>
              {statusOptions.map((opt) => (
                <EasyButton
                  key={`${item.id || item._id}-${opt.code}`}
                  secondary
                  medium
                  disabled={Boolean(item?.isArchived)}
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
  title: { fontSize: 22, fontWeight: "700", marginBottom: 6 },
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
  tabsWrap: {
    paddingBottom: 10,
  },
  bulkRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 10,
  },
  tabChip: {
    borderWidth: 1,
    borderColor: "#d8e2dc",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: "#f8f9fa",
  },
  tabChipActive: {
    backgroundColor: "#1f8a70",
    borderColor: "#1f8a70",
  },
  tabLabel: {
    color: "#344e41",
    fontWeight: "700",
  },
  tabLabelActive: {
    color: "white",
  },
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
  emptyText: {
    textAlign: "center",
    color: "#6c757d",
    marginTop: 30,
  },
  btnText: { color: "white", fontWeight: "700" },
});

export default Orders;
