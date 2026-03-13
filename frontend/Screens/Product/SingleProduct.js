import React, { useContext } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { useDispatch } from "react-redux";
import Toast from "react-native-toast-message";

import EasyButton from "../../Shared/StyledComponents/EasyButton";
import TrafficLight from "../../Shared/StyledComponents/TrafficLight";
import { addToCart } from "../../Redux/Actions/cartActions";
import { formatPHP } from "../../utils/currency";
import AuthGlobal from "../../Context/Store/AuthGlobal";

const SingleProduct = ({ route, navigation }) => {
  const item = route.params?.item;
  const dispatch = useDispatch();
  const authContext = useContext(AuthGlobal);
  const reviews = Array.isArray(item?.reviews) ? item.reviews : [];

  const availability =
    item.countInStock <= 0 ? (
      <TrafficLight unavailable />
    ) : item.countInStock <= 5 ? (
      <TrafficLight limited />
    ) : (
      <TrafficLight available />
    );

  const availabilityText =
    item.countInStock <= 0
      ? "Unavailable"
      : item.countInStock <= 5
      ? "Limited Stock"
      : "Available";

  const handleAdd = () => {
    if (!authContext?.stateUser?.isAuthenticated) {
      Toast.show({
        type: "info",
        text1: "Login required",
        text2: "Please login to add items to cart",
        topOffset: 60,
      });
      navigation.navigate("User", { screen: "Login" });
      return;
    }

    dispatch(addToCart(item));
    Toast.show({
      type: "success",
      text1: `${item.name} added`,
      text2: "Go to Cart to checkout",
      topOffset: 60,
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 20 }}>
      <Image
        source={{
          uri:
            item.image ||
            "https://cdn.pixabay.com/photo/2012/04/01/17/29/box-23649_960_720.png",
        }}
        resizeMode="contain"
        style={styles.image}
      />
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.brand}>{item.author || item.brand}</Text>
      <Text style={styles.price}>{formatPHP(item.price)}</Text>
      <Text style={styles.meta}>Stock: {item.countInStock ?? 0}</Text>
      <Text style={styles.meta}>Average Rating: {Number(item.rating || 0).toFixed(1)} / 5</Text>
      <Text style={styles.meta}>Reviews: {item.numReviews || reviews.length}</Text>

      <View style={styles.statusRow}>
        <Text>{availabilityText}</Text>
        {availability}
      </View>

      <Text style={styles.description}>{item.description}</Text>
      {item.richDescription ? <Text style={styles.description}>{item.richDescription}</Text> : null}

      <EasyButton primary large onPress={handleAdd}>
        <Text style={{ color: "white", fontWeight: "700" }}>Add To Cart</Text>
      </EasyButton>

      <Text style={styles.reviewsTitle}>All Reviews</Text>
      {reviews.length ? (
        reviews.map((review, idx) => (
          <View key={`${review._id || review.id || idx}`} style={styles.reviewCard}>
            <Text style={styles.reviewHeader}>{review.name || "User"}</Text>
            <Text style={styles.reviewMeta}>Rating: {review.rating}/5</Text>
            <Text style={styles.reviewText}>{review.comment || "No comment"}</Text>
            {Array.isArray(review.images) && review.images.length ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
                {review.images.map((img, i) => (
                  <Image key={`${img}-${i}`} source={{ uri: img }} style={styles.reviewImage} />
                ))}
              </ScrollView>
            ) : null}
          </View>
        ))
      ) : (
        <Text style={styles.noReviews}>No reviews yet.</Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "white",
  },
  image: {
    width: "100%",
    height: 250,
    marginBottom: 10,
  },
  name: {
    fontSize: 24,
    fontWeight: "700",
  },
  brand: {
    fontSize: 16,
    color: "#6c757d",
    marginBottom: 8,
  },
  price: {
    fontSize: 24,
    color: "#fb8500",
    fontWeight: "700",
  },
  meta: {
    color: "#495057",
    marginTop: 2,
  },
  statusRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  description: {
    marginVertical: 12,
    lineHeight: 20,
  },
  reviewsTitle: {
    marginTop: 16,
    marginBottom: 8,
    fontSize: 18,
    fontWeight: "700",
  },
  reviewCard: {
    borderWidth: 1,
    borderColor: "#ececec",
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    backgroundColor: "#fafafa",
  },
  reviewHeader: {
    fontWeight: "700",
  },
  reviewMeta: {
    color: "#495057",
    marginTop: 2,
  },
  reviewText: {
    marginTop: 4,
  },
  reviewImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginRight: 6,
  },
  noReviews: {
    color: "#6c757d",
  },
});

export default SingleProduct;