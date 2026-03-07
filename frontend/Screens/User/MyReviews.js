import React, { useCallback, useEffect } from "react";
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import Toast from "react-native-toast-message";

import EasyButton from "../../Shared/StyledComponents/EasyButton";
import { deleteMyReview, fetchMyReviews } from "../../Redux/Actions/reviewActions";

const FALLBACK_IMAGE =
  "https://cdn.pixabay.com/photo/2012/04/01/17/29/box-23649_960_720.png";

const MyReviews = ({ navigation }) => {
  const dispatch = useDispatch();
  const { myReviews: reviews, loading, error } = useSelector((state) => state.reviews);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        await dispatch(fetchMyReviews());
      };

      load();

      return undefined;
    }, [dispatch])
  );

  useEffect(() => {
    if (!error) return;
    Toast.show({
      type: "error",
      text1: "Failed to load reviews",
      text2: error,
      topOffset: 60,
    });
  }, [error]);

  const deleteReview = async (productId) => {
    try {
      await dispatch(deleteMyReview(productId));
      Toast.show({
        type: "success",
        text1: "Review removed",
        topOffset: 60,
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Delete failed",
        text2: error?.response?.data?.message || "Please try again",
        topOffset: 60,
      });
    }
  };

  const editReview = (item) => {
    navigation.navigate("Review Product", {
      orderId: item.review?.order,
      product: {
        id: item.productId,
        name: item.productName,
        image: item.productImage,
        reviews: [
          {
            user: item.review?.user,
            rating: item.review?.rating,
            comment: item.review?.comment,
            images: item.review?.images || [],
            order: item.review?.order,
          },
        ],
      },
    });
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
      <Text style={styles.title}>My Reviews</Text>

      {reviews.length ? (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item.productId}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.headRow}>
                <Image
                  source={{ uri: item.productImage || FALLBACK_IMAGE }}
                  style={styles.image}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.productName}>{item.productName}</Text>
                  <Text style={styles.meta}>Rating: {item.review?.rating}/5</Text>
                </View>
              </View>

              <Text style={styles.comment}>{item.review?.comment || "No comment"}</Text>

              <View style={styles.actionsRow}>
                <EasyButton secondary medium onPress={() => editReview(item)}>
                  <Text style={styles.btn}>Edit</Text>
                </EasyButton>
                <EasyButton danger medium onPress={() => deleteReview(item.productId)}>
                  <Text style={styles.btn}>Delete</Text>
                </EasyButton>
              </View>
            </View>
          )}
        />
      ) : (
        <Text style={styles.empty}>You have not reviewed any products yet.</Text>
      )}
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
  headRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  image: {
    width: 52,
    height: 52,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: "#f1f3f5",
  },
  productName: { fontWeight: "700" },
  meta: { color: "#6c757d" },
  comment: { marginTop: 8 },
  actionsRow: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "center",
  },
  empty: { color: "#6c757d" },
  btn: { color: "white", fontWeight: "700" },
});

export default MyReviews;
