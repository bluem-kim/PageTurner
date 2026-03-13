import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import Toast from "react-native-toast-message";

import EasyButton from "../../Shared/StyledComponents/EasyButton";
import {
  archiveAdminReview,
  bulkArchiveAdminReviews,
  fetchAdminReviews,
} from "../../Redux/Actions/reviewActions";

const formatDateTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleString("en-PH");
};

const Reviews = () => {
  const dispatch = useDispatch();
  const {
    adminReviews: reviews,
    loadingAdmin: loading,
    errorAdmin,
  } = useSelector((state) => state.reviews);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("active");

  const loadReviews = useCallback(async () => {
    const result = await dispatch(fetchAdminReviews());
    if (result?.type === "ADMIN_REVIEWS_FAIL") {
      Toast.show({
        type: "error",
        text1: "Failed to load reviews",
        text2: result?.payload || "Please try again",
        topOffset: 60,
      });
    }
  }, [dispatch]);

  useFocusEffect(
    useCallback(() => {
      loadReviews();
      return undefined;
    }, [loadReviews])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReviews();
    setRefreshing(false);
  };

  const toggleArchiveReview = async (item) => {
    try {
      const nextArchived = !Boolean(item?.isArchived);
      await dispatch(
        archiveAdminReview({
          productId: item.productId,
          reviewId: item.reviewId,
          isArchived: nextArchived,
        })
      );

      Toast.show({
        type: "success",
        text1: nextArchived ? "Review archived" : "Review restored",
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

  const bulkArchiveReviews = async (isArchived) => {
    const targets = filtered.filter((item) => Boolean(item?.isArchived) !== Boolean(isArchived));
    if (!targets.length) {
      Toast.show({ type: "info", text1: "No matching reviews", topOffset: 60 });
      return;
    }

    try {
      await dispatch(
        bulkArchiveAdminReviews({
          isArchived,
          items: targets.map((item) => ({
            productId: item.productId,
            reviewId: item.reviewId,
          })),
        })
      );

      Toast.show({
        type: "success",
        text1: isArchived ? "Bulk archive done" : "Bulk restore done",
        text2: `${targets.length} reviews processed`,
        topOffset: 60,
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Bulk update failed",
        text2: error?.response?.data?.message || "Please try again",
        topOffset: 60,
      });
    }
  };

  const filtered = (reviews || []).filter((item) => {
    const archived = Boolean(item?.isArchived);
    const matchesTab = activeTab === "archived" ? archived : !archived;
    if (!matchesTab) return false;

    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;

    const productName = String(item?.productName || "").toLowerCase();
    const reviewerName = String(item?.reviewerName || "").toLowerCase();
    const comment = String(item?.comment || "").toLowerCase();
    const rating = String(item?.rating || "").toLowerCase();

    return (
      productName.includes(q) ||
      reviewerName.includes(q) ||
      comment.includes(q) ||
      rating.includes(q)
    );
  });

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1f8a70" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Review Management</Text>
      {errorAdmin ? <Text style={styles.errorText}>{errorAdmin}</Text> : null}

      <TextInput
        style={styles.searchInput}
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search by product, reviewer, comment, rating"
      />

      <View style={styles.tabRow}>
        <EasyButton
          primary={activeTab === "active"}
          secondary={activeTab !== "active"}
          medium
          onPress={() => setActiveTab("active")}
        >
          <Text style={styles.btnText}>
            Active ({(reviews || []).filter((item) => !item?.isArchived).length})
          </Text>
        </EasyButton>
        <EasyButton
          primary={activeTab === "archived"}
          secondary={activeTab !== "archived"}
          medium
          onPress={() => setActiveTab("archived")}
        >
          <Text style={styles.btnText}>
            Archived ({(reviews || []).filter((item) => item?.isArchived).length})
          </Text>
        </EasyButton>
      </View>

      <View style={styles.bulkRow}>
        <EasyButton danger medium onPress={() => bulkArchiveReviews(true)}>
          <Text style={styles.btnText}>Archive Visible</Text>
        </EasyButton>
        <EasyButton secondary medium onPress={() => bulkArchiveReviews(false)}>
          <Text style={styles.btnText}>Restore Visible</Text>
        </EasyButton>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item, index) => `${item.reviewId || index}-${item.productId || ""}`}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.emptyText}>No reviews found.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.productName}>{item.productName || "Unknown Product"}</Text>
            <Text style={styles.meta}>Reviewer: {item.reviewerName || "User"}</Text>
            <Text style={styles.meta}>Rating: {item.rating || 0}/5</Text>
            <Text style={styles.meta}>State: {item?.isArchived ? "Archived" : "Active"}</Text>
            <Text style={styles.meta}>Date: {formatDateTime(item.createdAt)}</Text>
            <Text style={styles.comment}>{item.comment || "No comment"}</Text>

            <View style={styles.actionRow}>
              <EasyButton danger medium onPress={() => toggleArchiveReview(item)}>
                <Text style={styles.btnText}>{item?.isArchived ? "Restore" : "Archive"}</Text>
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
  title: { fontSize: 22, fontWeight: "700", marginBottom: 10 },
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
  productName: {
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 2,
  },
  meta: {
    color: "#495057",
  },
  comment: {
    marginTop: 6,
    color: "#222",
  },
  actionRow: {
    marginTop: 8,
    flexDirection: "row",
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
  errorText: {
    color: "#c1121f",
    marginBottom: 8,
  },
});

export default Reviews;
