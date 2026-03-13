import React, { useCallback, useEffect, useState } from "react";
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
import { useDispatch, useSelector } from "react-redux";
import Toast from "react-native-toast-message";

import EasyButton from "../../Shared/StyledComponents/EasyButton";
import { archiveProduct, fetchProducts } from "../../Redux/Actions/productActions";
import { formatPHP } from "../../utils/currency";
import { buildListPdfHtml, exportPdfFromHtml } from "../../utils/pdfExport";

const Products = ({ navigation }) => {
  const dispatch = useDispatch();
  const { items: products, loading, error } = useSelector((state) => state.products);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("active");

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        try {
          await dispatch(fetchProducts({ includeArchived: true }));
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
      await dispatch(fetchProducts({ includeArchived: true }));
    } finally {
      setRefreshing(false);
    }
  };

  const toggleArchive = async (item) => {
    try {
      const nextArchived = !Boolean(item?.isArchived);
      await dispatch(archiveProduct(item.id || item._id, nextArchived));
      Toast.show({
        type: "success",
        text1: nextArchived ? "Product archived" : "Product restored",
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

  const bulkArchiveProducts = async (isArchived) => {
    const targets = filteredProducts.filter(
      (item) => Boolean(item?.isArchived) !== Boolean(isArchived)
    );
    if (!targets.length) {
      Toast.show({ type: "info", text1: "No matching products", topOffset: 60 });
      return;
    }

    try {
      await Promise.all(
        targets.map((item) => dispatch(archiveProduct(item.id || item._id, isArchived)).catch(() => null))
      );

      Toast.show({
        type: "success",
        text1: isArchived ? "Bulk archive done" : "Bulk restore done",
        text2: `${targets.length} products processed`,
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

  useEffect(() => {
    if (!error) return;
    Toast.show({
      type: "error",
      text1: "Failed to load products",
      text2: error,
      topOffset: 60,
    });
  }, [error]);

  const filteredProducts = (products || []).filter((item) => {
    const archived = Boolean(item?.isArchived);
    const matchesTab = activeTab === "archived" ? archived : !archived;
    if (!matchesTab) return false;

    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;

    const name = String(item?.name || "").toLowerCase();
    const author = String(item?.author || item?.brand || "").toLowerCase();
    const description = String(item?.description || "").toLowerCase();

    return name.includes(q) || author.includes(q) || description.includes(q);
  });

  const exportProductListPdf = async () => {
    try {
      const rows = (products || []).map((item, index) => [
        index + 1,
        item?.name || "N/A",
        item?.author || item?.brand || "N/A",
        formatPHP(item?.price || 0),
        item?.countInStock ?? 0,
        item?.isArchived ? "Archived" : "Active",
      ]);

      const html = buildListPdfHtml({
        title: "PageTurner Product Records",
        summaryLines: [{ label: "Total records:", value: String(rows.length) }],
        headers: ["#", "Product", "Author", "Price", "Stock", "State"],
        rows,
      });

      const result = await exportPdfFromHtml(html, {
        fileName: "PageTurnerProductRecords",
        dialogTitle: "Export product records",
      });

      Toast.show({
        type: "success",
        text1: "Product records exported",
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
      <View style={styles.topRow}>
        <EasyButton primary medium onPress={() => navigation.navigate("Product Form")}>
          <Text style={styles.btnText}>Add Product</Text>
        </EasyButton>
      </View>
      <View style={styles.exportRow}>
        <TouchableOpacity style={styles.exportBtn} onPress={exportProductListPdf}>
          <Text style={styles.exportBtnText}>Export PDF</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.searchInput}
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search products"
      />

      <View style={styles.tabsRow}>
        <EasyButton
          secondary={activeTab !== "active"}
          primary={activeTab === "active"}
          medium
          onPress={() => setActiveTab("active")}
        >
          <Text style={styles.btnText}>
            Active ({(products || []).filter((item) => !item?.isArchived).length})
          </Text>
        </EasyButton>
        <EasyButton
          secondary={activeTab !== "archived"}
          primary={activeTab === "archived"}
          medium
          onPress={() => setActiveTab("archived")}
        >
          <Text style={styles.btnText}>
            Archived ({(products || []).filter((item) => item?.isArchived).length})
          </Text>
        </EasyButton>
      </View>

      <View style={styles.bulkRow}>
        <EasyButton danger medium onPress={() => bulkArchiveProducts(true)}>
          <Text style={styles.btnText}>Archive Visible</Text>
        </EasyButton>
        <EasyButton secondary medium onPress={() => bulkArchiveProducts(false)}>
          <Text style={styles.btnText}>Restore Visible</Text>
        </EasyButton>
      </View>

      <FlatList
        data={filteredProducts}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        keyExtractor={(item) => item.id || item._id}
        ListEmptyComponent={<Text style={styles.emptyText}>No products in this tab.</Text>}
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle}>{item.name}</Text>
              <Text style={styles.itemMeta}>Author: {item.author || item.brand || "N/A"}</Text>
              <Text style={styles.itemMeta}>Price: {formatPHP(item.price)}</Text>
              <Text style={styles.itemMeta}>Stock: {item.countInStock ?? 0}</Text>
              <Text style={styles.itemMeta}>State: {item?.isArchived ? "Archived" : "Active"}</Text>
            </View>
            <View>
              <EasyButton
                secondary
                medium
                onPress={() => navigation.navigate("Product Form", { item })}
              >
                <Text style={styles.btnText}>Edit</Text>
              </EasyButton>
              <EasyButton danger medium onPress={() => toggleArchive(item)}>
                <Text style={styles.btnText}>{item?.isArchived ? "Unarchive" : "Archive"}</Text>
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
    justifyContent: "center",
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
  tabsRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 8,
  },
  bulkRow: {
    flexDirection: "row",
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
  emptyText: { textAlign: "center", color: "#6c757d", marginTop: 25 },
  btnText: { color: "white", fontWeight: "700" },
});

export default Products;
