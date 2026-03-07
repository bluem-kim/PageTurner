import React, { useMemo, useState } from "react";
import { FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import Toast from "react-native-toast-message";
import * as ImagePicker from "expo-image-picker";
import { useContext } from "react";
import { useDispatch } from "react-redux";

import EasyButton from "../../Shared/StyledComponents/EasyButton";
import AuthGlobal from "../../Context/Store/AuthGlobal";
import { submitReview as submitReviewAction } from "../../Redux/Actions/reviewActions";

const ratingOptions = [1, 2, 3, 4, 5];

const ReviewProduct = ({ route, navigation }) => {
  const dispatch = useDispatch();
  const context = useContext(AuthGlobal);
  const currentUserId = context?.stateUser?.user?.userId || context?.stateUser?.user?.id;
  const product = route.params?.product;
  const orderId = route.params?.orderId;

  const existingReview = useMemo(() => {
    const reviews = Array.isArray(product?.reviews) ? product.reviews : [];
    return reviews.find((review) => {
      const uid = review?.user?._id || review?.user?.id || review?.user;
      return String(uid) === String(currentUserId);
    });
  }, [product, currentUserId]);

  const [rating, setRating] = useState(existingReview?.rating || 5);
  const [comment, setComment] = useState(existingReview?.comment || "");
  const [existingImages, setExistingImages] = useState(existingReview?.images || []);
  const [newImages, setNewImages] = useState([]);
  const [saving, setSaving] = useState(false);

  const productId = useMemo(() => product?.id || product?._id || "", [product]);

  const pickFromGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== "granted") {
        Toast.show({
          type: "error",
          text1: "Permission denied",
          text2: "Allow photo access to upload review images",
          topOffset: 60,
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        allowsMultipleSelection: true,
        selectionLimit: 5,
        quality: 0.7,
      });

      if (result.canceled || !result.assets?.length) return;

      setNewImages((prev) => {
        const merged = [...prev, ...result.assets];
        return merged.slice(0, Math.max(0, 5 - existingImages.length));
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Image selection failed",
        topOffset: 60,
      });
    }
  };

  const takePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (permission.status !== "granted") {
        Toast.show({
          type: "error",
          text1: "Permission denied",
          text2: "Allow camera access to add review images",
          topOffset: 60,
        });
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (result.canceled || !result.assets?.length) return;

      setNewImages((prev) => {
        const merged = [...prev, ...result.assets];
        return merged.slice(0, Math.max(0, 5 - existingImages.length));
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Camera unavailable",
        topOffset: 60,
      });
    }
  };

  const removeExistingImage = (index) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
  };

  const submitReview = async () => {
    if (!productId || !orderId) {
      Toast.show({
        type: "error",
        text1: "Invalid review request",
        topOffset: 60,
      });
      return;
    }

    try {
      setSaving(true);
      await dispatch(
        submitReviewAction({
          productId,
          orderId,
          rating,
          comment,
          existingImages,
          newImages,
        })
      );

      Toast.show({
        type: "success",
        text1: "Review submitted",
        topOffset: 60,
      });
      navigation.goBack();
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Submit failed",
        text2: error?.message || "Please try again",
        topOffset: 60,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Review Product</Text>
      <Text style={styles.meta}>{product?.name || "Product"}</Text>

      <Text style={styles.sectionTitle}>Rating</Text>
      <View style={styles.ratingRow}>
        {ratingOptions.map((r) => {
          const active = r === rating;
          return (
            <TouchableOpacity
              key={r}
              style={[styles.ratingChip, active && styles.ratingChipActive]}
              onPress={() => setRating(r)}
            >
              <Text style={[styles.ratingText, active && styles.ratingTextActive]}>{r}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.sectionTitle}>Comment</Text>
      <TextInput
        value={comment}
        onChangeText={setComment}
        placeholder="Share your feedback"
        style={styles.commentInput}
        multiline
      />

      <View style={styles.imageActionRow}>
        <EasyButton secondary medium onPress={pickFromGallery}>
          <Text style={styles.btnText}>Add Image</Text>
        </EasyButton>
        <EasyButton secondary medium onPress={takePhoto}>
          <Text style={styles.btnText}>Take Photo</Text>
        </EasyButton>
      </View>

      <FlatList
        horizontal
        data={existingImages.map((uri, index) => ({ type: "existing", uri, index })).concat(
          newImages.map((asset, index) => ({ type: "new", uri: asset.uri, index }))
        )}
        keyExtractor={(item, index) => `${item.type}-${item.uri}-${index}`}
        contentContainerStyle={{ marginBottom: 12 }}
        renderItem={({ item }) => (
          <View style={styles.imageWrap}>
            <Image source={{ uri: item.uri }} style={styles.image} />
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => {
                if (item.type === "existing") removeExistingImage(item.index);
                else removeNewImage(item.index);
              }}
            >
              <Text style={styles.removeBtnText}>X</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <EasyButton primary large onPress={submitReview}>
        <Text style={styles.btnText}>{saving ? "Submitting..." : existingReview ? "Update Review" : "Submit Review"}</Text>
      </EasyButton>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white", padding: 12 },
  title: { fontSize: 22, fontWeight: "700" },
  meta: { color: "#6c757d", marginBottom: 10 },
  sectionTitle: { fontWeight: "700", marginTop: 8, marginBottom: 6 },
  ratingRow: { flexDirection: "row", marginBottom: 8 },
  ratingChip: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  ratingChipActive: {
    borderColor: "#1f8a70",
    backgroundColor: "#eaf8f3",
  },
  ratingText: { fontWeight: "700", color: "#666" },
  ratingTextActive: { color: "#1f8a70" },
  commentInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    minHeight: 100,
    textAlignVertical: "top",
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  imageActionRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 10,
  },
  imageWrap: {
    marginRight: 8,
    position: "relative",
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeBtn: {
    position: "absolute",
    right: -6,
    top: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#c1121f",
    justifyContent: "center",
    alignItems: "center",
  },
  removeBtnText: { color: "white", fontWeight: "700", fontSize: 11 },
  btnText: { color: "white", fontWeight: "700" },
});

export default ReviewProduct;
