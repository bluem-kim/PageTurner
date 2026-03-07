import React, { useEffect, useMemo, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  FlatList,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Toast from "react-native-toast-message";
import * as ImagePicker from "expo-image-picker";

import EasyButton from "../../Shared/StyledComponents/EasyButton";
import baseURL from "../../assets/common/baseurl";

const MAX_TOTAL_IMAGES = 20;
const MAX_UPLOAD_BATCH = 1;

const ProductForm = ({ route, navigation }) => {
  const item = route.params?.item || null;

  const [name, setName] = useState(item?.name || "");
  const [author, setAuthor] = useState(item?.author || item?.brand || "");
  const [price, setPrice] = useState(item?.price ? String(item.price) : "");
  const [countInStock, setCountInStock] = useState(
    item?.countInStock !== undefined ? String(item.countInStock) : ""
  );
  const [description, setDescription] = useState(item?.description || "");
  const [existingImages, setExistingImages] = useState(() => {
    if (Array.isArray(item?.images) && item.images.length) return item.images;
    if (item?.image) return [item.image];
    return [];
  });
  const [pickedImages, setPickedImages] = useState([]);
  const initialSubGenres = useMemo(() => {
    if (Array.isArray(item?.subGenres) && item.subGenres.length) {
      return item.subGenres
        .map((g) => g?.id || g?._id || g)
        .filter(Boolean)
        .slice(0, 3);
    }
    if (!item?.category) return [];
    const fallback = item.category.id || item.category._id || item.category;
    return fallback ? [fallback] : [];
  }, [item]);
  const initialMainGenreId = useMemo(() => {
    if (item?.genre) {
      return item.genre.id || item.genre._id || item.genre;
    }
    if (item?.category?.parent) {
      return item.category.parent.id || item.category.parent._id || item.category.parent;
    }
    return "";
  }, [item]);
  const [mainGenre, setMainGenre] = useState(initialMainGenreId);
  const [subGenres, setSubGenres] = useState(initialSubGenres);
  const [categories, setCategories] = useState([]);

  const mainGenres = useMemo(
    () => categories.filter((c) => !subGenres.includes(c.id || c._id)),
    [categories, subGenres]
  );

  const availableSubGenres = useMemo(
    () => categories.filter((c) => (c.id || c._id) !== mainGenre),
    [categories, mainGenre]
  );

  useEffect(() => {
    axios
      .get(`${baseURL}categories?includeSubgenres=1`)
      .then((res) => setCategories(res.data || []))
      .catch(() => {
        Toast.show({
          type: "error",
          text1: "Failed to load genres",
          topOffset: 60,
        });
      });
  }, []);

  const pickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== "granted") {
        Toast.show({
          type: "error",
          text1: "Permission denied",
          text2: "Allow photo access to upload images",
          topOffset: 60,
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        allowsMultipleSelection: true,
        selectionLimit: 8,
        quality: 0.6,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const totalNow = existingImages.length + pickedImages.length;
      const remainingSlots = MAX_TOTAL_IMAGES - totalNow;
      if (remainingSlots <= 0) {
        Toast.show({
          type: "error",
          text1: "Image limit reached",
          text2: `Maximum ${MAX_TOTAL_IMAGES} images per product`,
          topOffset: 60,
        });
        return;
      }

      const toAdd = result.assets.slice(0, remainingSlots);
      setPickedImages((prev) => [...prev, ...toAdd]);

      if (toAdd.length < result.assets.length) {
        Toast.show({
          type: "error",
          text1: "Some images were skipped",
          text2: `Maximum ${MAX_TOTAL_IMAGES} images per product`,
          topOffset: 60,
        });
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Image selection failed",
        topOffset: 60,
      });
    }
  };

  const pickSingleImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") {
      Toast.show({
        type: "error",
        text1: "Permission denied",
        text2: "Allow photo access to update images",
        topOffset: 60,
      });
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    });

    if (result.canceled || !result.assets?.length) return null;
    return result.assets[0];
  };

  const takePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (permission.status !== "granted") {
        Toast.show({
          type: "error",
          text1: "Permission denied",
          text2: "Allow camera access to capture images",
          topOffset: 60,
        });
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const totalNow = existingImages.length + pickedImages.length;
      if (totalNow >= MAX_TOTAL_IMAGES) {
        Toast.show({
          type: "error",
          text1: "Image limit reached",
          text2: `Maximum ${MAX_TOTAL_IMAGES} images per product`,
          topOffset: 60,
        });
        return;
      }

      setPickedImages((prev) => [...prev, ...result.assets]);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Camera capture failed",
        topOffset: 60,
      });
    }
  };

  const removeExistingImage = (index) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removePickedImage = (index) => {
    setPickedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const replaceExistingImage = async (index) => {
    try {
      const replacement = await pickSingleImage();
      if (!replacement) return;

      setExistingImages((prev) => prev.filter((_, i) => i !== index));
      setPickedImages((prev) => [...prev, replacement]);
      Toast.show({
        type: "success",
        text1: "Image replaced",
        topOffset: 60,
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Replace failed",
        topOffset: 60,
      });
    }
  };

  const replacePickedImage = async (index) => {
    try {
      const replacement = await pickSingleImage();
      if (!replacement) return;

      setPickedImages((prev) => prev.map((img, i) => (i === index ? replacement : img)));
      Toast.show({
        type: "success",
        text1: "Image replaced",
        topOffset: 60,
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Replace failed",
        topOffset: 60,
      });
    }
  };

  const save = async () => {
    if (!name || !mainGenre || !price) {
      Toast.show({
        type: "error",
        text1: "Missing required fields",
        text2: "Name, 1 main genre, and price are required",
        topOffset: 60,
      });
      return;
    }

    if (subGenres.length > 3) {
      Toast.show({
        type: "error",
        text1: "Too many sub genres",
        text2: "Maximum of 3 sub genres only",
        topOffset: 60,
      });
      return;
    }

    try {
      const token = await AsyncStorage.getItem("jwt");

      const sendMultipart = async (url, formData) => {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        const raw = await response.text();
        let parsed = {};
        try {
          parsed = raw ? JSON.parse(raw) : {};
        } catch (error) {
          parsed = { message: raw || "Invalid server response" };
        }

        if (!response.ok) {
          const message = parsed?.message || `Upload failed (${response.status})`;
          throw new Error(message);
        }

        return parsed;
      };

      const makePayload = (existingImagesValue, imagesBatch = []) => {
        const payload = new FormData();
        payload.append("name", name);
        payload.append("author", author);
        payload.append("brand", author);
        payload.append("description", description);
        payload.append("genre", mainGenre);
        payload.append("subGenres", JSON.stringify(subGenres));
        payload.append("category", subGenres[0] || mainGenre);
        payload.append("price", String(Number(price)));
        payload.append("countInStock", String(Number(countInStock || 0)));
        payload.append("isFeatured", "false");
        payload.append("existingImages", JSON.stringify(existingImagesValue));

        imagesBatch.forEach((asset, index) => {
          payload.append("images", {
            uri: asset.uri,
            name: asset.fileName || `product-${Date.now()}-${index}.jpg`,
            type: asset.mimeType || "image/jpeg",
          });
        });

        return payload;
      };

      let currentExistingImages = [...existingImages];
      let uploadedProductId = item?.id || item?._id || null;
      const pendingImages = [...pickedImages];

      if (uploadedProductId) {
        if (!pendingImages.length) {
          await sendMultipart(
            `${baseURL}products/${uploadedProductId}`,
            makePayload(currentExistingImages, [])
          );
        } else {
          for (let i = 0; i < pendingImages.length; i += MAX_UPLOAD_BATCH) {
            const batch = pendingImages.slice(i, i + MAX_UPLOAD_BATCH);
            const response = await sendMultipart(
              `${baseURL}products/${uploadedProductId}`,
              makePayload(currentExistingImages, batch)
            );
            currentExistingImages = response?.images || currentExistingImages;
          }
        }

        Toast.show({ type: "success", text1: "Product updated", topOffset: 60 });
      } else {
        const firstBatch = pendingImages.slice(0, MAX_UPLOAD_BATCH);
        const createResponse = await sendMultipart(
          `${baseURL}products`,
          makePayload(currentExistingImages, firstBatch)
        );

        uploadedProductId = createResponse?.id || createResponse?._id;
        currentExistingImages = createResponse?.images || currentExistingImages;

        for (let i = MAX_UPLOAD_BATCH; i < pendingImages.length; i += MAX_UPLOAD_BATCH) {
          const batch = pendingImages.slice(i, i + MAX_UPLOAD_BATCH);
          const response = await sendMultipart(
            `${baseURL}products/${uploadedProductId}`,
            makePayload(currentExistingImages, batch)
          );
          currentExistingImages = response?.images || currentExistingImages;
        }

        Toast.show({ type: "success", text1: "Product created", topOffset: 60 });
      }

      navigation.goBack();
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Save failed",
        text2: error?.message || "Upload failed",
        topOffset: 60,
      });
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{item ? "Edit Product" : "Add Product"}</Text>

      <View style={styles.imageActions}>
        <TouchableOpacity style={[styles.imagePicker, styles.actionHalf]} onPress={pickImage}>
          <Text style={styles.imagePickerText}>Add from gallery</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.imagePicker, styles.actionHalf]} onPress={takePhoto}>
          <Text style={styles.imagePickerText}>Add from camera</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.imagesHint}>
        Manage images below: remove, replace, or add more. Max {MAX_TOTAL_IMAGES} images.
      </Text>

      <FlatList
        horizontal
        data={[
          ...existingImages.map((uri, index) => ({ type: "existing", uri, index })),
          ...pickedImages.map((asset, index) => ({ type: "picked", uri: asset.uri, index })),
        ]}
        keyExtractor={(img, idx) => `${img.type}-${img.uri}-${idx}`}
        contentContainerStyle={{ marginBottom: 10 }}
        renderItem={({ item: img }) => (
          <View style={styles.imageCard}>
            <Image source={{ uri: img.uri }} style={styles.thumb} />
            <View style={styles.thumbActions}>
              <TouchableOpacity
                style={styles.thumbBtn}
                onPress={() => {
                  if (img.type === "existing") removeExistingImage(img.index);
                  else removePickedImage(img.index);
                }}
              >
                <Text style={styles.thumbBtnText}>Remove</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.thumbBtn, styles.thumbBtnReplace]}
                onPress={() => {
                  if (img.type === "existing") replaceExistingImage(img.index);
                  else replacePickedImage(img.index);
                }}
              >
                <Text style={styles.thumbBtnText}>Replace</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Name" />
      <TextInput style={styles.input} value={author} onChangeText={setAuthor} placeholder="Author" />
      <TextInput
        style={styles.input}
        value={price}
        onChangeText={setPrice}
        placeholder="Price"
        keyboardType="decimal-pad"
      />
      <TextInput
        style={styles.input}
        value={countInStock}
        onChangeText={setCountInStock}
        placeholder="Count in stock"
        keyboardType="numeric"
      />
      <TextInput
        style={[styles.input, { height: 90 }]}
        value={description}
        onChangeText={setDescription}
        placeholder="Description"
        multiline
      />
      <Text style={styles.subtitle}>Select Main Genre</Text>
      <View style={styles.categoriesWrap}>
        {mainGenres.map((c) => {
          const id = c.id || c._id;
          const active = mainGenre === id;
          return (
            <TouchableOpacity
              key={id}
              style={[styles.categoryChip, active && styles.categoryChipActive]}
              onPress={() => {
                setMainGenre(id);
                setSubGenres((prev) => prev.filter((x) => x !== id));
              }}
            >
              <Text style={[styles.categoryText, active && styles.categoryTextActive]}>{c.name}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.subtitle}>Select Sub Genre(s) - optional, max 3</Text>
      <View style={styles.categoriesWrap}>
        {availableSubGenres.map((c) => {
          const id = c.id || c._id;
          const active = subGenres.includes(id);
          return (
            <TouchableOpacity
              key={id}
              style={[styles.categoryChip, active && styles.categoryChipActive]}
              onPress={() => {
                setSubGenres((prev) => {
                  if (prev.includes(id)) {
                    return prev.filter((x) => x !== id);
                  }
                  if (prev.length >= 3) {
                    Toast.show({
                      type: "error",
                      text1: "Maximum reached",
                      text2: "You can select up to 3 sub genres",
                      topOffset: 60,
                    });
                    return prev;
                  }
                  return [...prev, id];
                });
              }}
            >
              <Text style={[styles.categoryText, active && styles.categoryTextActive]}>{c.name}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <EasyButton primary large onPress={save}>
        <Text style={styles.btnText}>{item ? "Update" : "Create"}</Text>
      </EasyButton>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: "white",
  },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 10 },
  imagePicker: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    alignItems: "center",
  },
  imageActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  actionHalf: {
    width: "48.5%",
    marginBottom: 0,
  },
  previewImage: {
    width: "100%",
    height: 180,
    borderRadius: 10,
    backgroundColor: "#f1f3f5",
  },
  imagePickerText: {
    marginTop: 0,
    color: "#495057",
    fontWeight: "600",
  },
  imagesHint: {
    color: "#6c757d",
    marginBottom: 8,
  },
  imageCard: {
    marginRight: 8,
  },
  thumb: {
    width: 84,
    height: 84,
    borderRadius: 8,
    backgroundColor: "#f1f3f5",
  },
  thumbActions: {
    flexDirection: "row",
    marginTop: 4,
    justifyContent: "space-between",
  },
  thumbBtn: {
    backgroundColor: "#c92a2a",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  thumbBtnReplace: {
    backgroundColor: "#1864ab",
    marginLeft: 4,
  },
  thumbBtnText: {
    color: "white",
    fontSize: 11,
    fontWeight: "700",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 10,
    height: 44,
  },
  subtitle: {
    fontWeight: "700",
    marginBottom: 8,
  },
  categoriesWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  categoryChip: {
    borderWidth: 1,
    borderColor: "#adb5bd",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  categoryChipActive: {
    backgroundColor: "#1f8a70",
    borderColor: "#1f8a70",
  },
  categoryText: { color: "#495057" },
  categoryTextActive: { color: "white", fontWeight: "700" },
  btnText: { color: "white", fontWeight: "700" },
});

export default ProductForm;
