import React, { useCallback, useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Toast from "react-native-toast-message";

import EasyButton from "../../Shared/StyledComponents/EasyButton";
import baseURL from "../../assets/common/baseurl";

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const load = async () => {
    const res = await axios.get(`${baseURL}categories?includeSubgenres=1`);
    setCategories(res.data || []);
  };

  useFocusEffect(
    useCallback(() => {
      load().catch(() => {
        Toast.show({
          type: "error",
          text1: "Failed to load genres",
          topOffset: 60,
        });
      });
    }, [])
  );

  const addCategory = async () => {
    if (!name.trim()) return;
    try {
      const token = await AsyncStorage.getItem("jwt");
      const res = await axios.post(
        `${baseURL}categories`,
        {
          name: name.trim(),
          description: description.trim(),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCategories((prev) => [...prev, res.data]);
      setName("");
      setDescription("");
      Toast.show({ type: "success", text1: "Genre added", topOffset: 60 });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Add failed",
        text2: error?.response?.data?.message || "Please try again",
        topOffset: 60,
      });
    }
  };

  const deleteCategory = async (item) => {
    try {
      const token = await AsyncStorage.getItem("jwt");
      await axios.delete(`${baseURL}categories/${item.id || item._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories((prev) => prev.filter((c) => (c.id || c._id) !== (item.id || item._id)));
      Toast.show({ type: "success", text1: "Genre deleted", topOffset: 60 });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Delete failed",
        text2: error?.response?.data?.message || "Please try again",
        topOffset: 60,
      });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manage Genres</Text>

      <View style={styles.row}>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="New genre name"
          style={styles.input}
        />
        <EasyButton primary medium onPress={addCategory}>
          <Text style={styles.btnText}>Add</Text>
        </EasyButton>
      </View>

      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder="Genre description (optional)"
        style={[styles.input, styles.descriptionInput]}
        multiline
      />

      <FlatList
        data={categories}
        keyExtractor={(item) => item.id || item._id}
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              {item.description ? (
                <Text style={styles.itemDescription}>{item.description}</Text>
              ) : null}
            </View>
            <EasyButton danger medium onPress={() => deleteCategory(item)}>
              <Text style={styles.btnText}>Delete</Text>
            </EasyButton>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white", padding: 12 },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 10 },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    marginRight: 8,
    paddingHorizontal: 10,
    height: 44,
  },
  itemCard: {
    borderWidth: 1,
    borderColor: "#ececec",
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemInfo: {
    flex: 1,
    paddingRight: 10,
  },
  itemName: { fontWeight: "700" },
  itemDescription: {
    color: "#555",
    marginTop: 4,
  },
  descriptionInput: {
    minHeight: 80,
    textAlignVertical: "top",
    marginBottom: 12,
    paddingTop: 10,
  },
  btnText: { color: "white", fontWeight: "700" },
});

export default Categories;
