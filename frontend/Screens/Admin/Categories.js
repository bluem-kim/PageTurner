import React, { useCallback, useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Toast from "react-native-toast-message";

import EasyButton from "../../Shared/StyledComponents/EasyButton";
import baseURL from "../../assets/common/baseurl";
import { buildListPdfHtml, exportPdfFromHtml } from "../../utils/pdfExport";

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("active");
  const [editingId, setEditingId] = useState("");
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const load = async () => {
    const res = await axios.get(`${baseURL}categories?includeSubgenres=1&includeArchived=1`);
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

  const startEdit = (item) => {
    setEditingId(String(item.id || item._id || ""));
    setEditName(String(item?.name || ""));
    setEditDescription(String(item?.description || ""));
  };

  const cancelEdit = () => {
    setEditingId("");
    setEditName("");
    setEditDescription("");
  };

  const saveEdit = async () => {
    if (!editingId || !editName.trim()) return;

    try {
      const token = await AsyncStorage.getItem("jwt");
      const response = await axios.put(
        `${baseURL}categories/${editingId}`,
        {
          name: editName.trim(),
          description: editDescription.trim(),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCategories((prev) =>
        (prev || []).map((item) => {
          const id = String(item.id || item._id);
          if (id !== String(editingId)) return item;
          return response.data;
        })
      );

      Toast.show({ type: "success", text1: "Genre updated", topOffset: 60 });
      cancelEdit();
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Update failed",
        text2: error?.response?.data?.message || "Please try again",
        topOffset: 60,
      });
    }
  };

  const toggleArchiveCategory = async (item) => {
    try {
      const token = await AsyncStorage.getItem("jwt");
      const nextArchived = !Boolean(item?.isArchived);
      await axios.put(
        `${baseURL}categories/${item.id || item._id}/archive`,
        { isArchived: nextArchived },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setCategories((prev) =>
        (prev || []).map((c) => {
          const id = c.id || c._id;
          const target = item.id || item._id;
          if (String(id) !== String(target)) return c;
          return { ...c, isArchived: nextArchived };
        })
      );
      Toast.show({
        type: "success",
        text1: nextArchived ? "Genre archived" : "Genre restored",
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

  const bulkArchiveCategories = async (isArchived) => {
    const targets = filteredCategories.filter(
      (item) => Boolean(item?.isArchived) !== Boolean(isArchived)
    );

    if (!targets.length) {
      Toast.show({ type: "info", text1: "No matching genres", topOffset: 60 });
      return;
    }

    try {
      const token = await AsyncStorage.getItem("jwt");
      let success = 0;

      for (const item of targets) {
        try {
          await axios.put(
            `${baseURL}categories/${item.id || item._id}/archive`,
            { isArchived },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          success += 1;
        } catch (error) {
          // Continue even if one request fails.
        }
      }

      await load();

      Toast.show({
        type: "success",
        text1: isArchived ? "Bulk archive done" : "Bulk restore done",
        text2: `${success} genres updated`,
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

  const filteredCategories = (categories || []).filter((item) => {
    const archived = Boolean(item?.isArchived);
    const matchesTab = activeTab === "archived" ? archived : !archived;
    if (!matchesTab) return false;

    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;

    const nameValue = String(item?.name || "").toLowerCase();
    const descValue = String(item?.description || "").toLowerCase();
    return nameValue.includes(q) || descValue.includes(q);
  });

  const exportGenreListPdf = async () => {
    try {
      const rows = (categories || []).map((item, index) => [
        index + 1,
        item?.name || "N/A",
        item?.description || "-",
        item?.isArchived ? "Archived" : "Active",
      ]);

      const html = buildListPdfHtml({
        title: "PageTurner Genre Records",
        summaryLines: [{ label: "Total records:", value: String(rows.length) }],
        headers: ["#", "Genre", "Description", "State"],
        rows,
      });

      const result = await exportPdfFromHtml(html, {
        fileName: "PageTurnerGenreRecords",
        dialogTitle: "Export genre records",
      });

      Toast.show({
        type: "success",
        text1: "Genre records exported",
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manage Genres</Text>
      <View style={styles.exportRow}>
        <TouchableOpacity style={styles.exportBtn} onPress={exportGenreListPdf}>
          <Text style={styles.exportBtnText}>Export PDF</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrap}>
        <Text style={styles.searchLabel}>Search Genres</Text>
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Type name or description"
          style={[styles.input, styles.searchInput]}
        />
      </View>

      <View style={styles.tabRow}>
        <EasyButton
          primary={activeTab === "active"}
          secondary={activeTab !== "active"}
          medium
          onPress={() => setActiveTab("active")}
        >
          <Text style={styles.btnText}>
            Active ({(categories || []).filter((item) => !item?.isArchived).length})
          </Text>
        </EasyButton>
        <EasyButton
          primary={activeTab === "archived"}
          secondary={activeTab !== "archived"}
          medium
          onPress={() => setActiveTab("archived")}
        >
          <Text style={styles.btnText}>
            Archived ({(categories || []).filter((item) => item?.isArchived).length})
          </Text>
        </EasyButton>
      </View>

      <View style={styles.bulkRow}>
        <EasyButton danger medium onPress={() => bulkArchiveCategories(true)}>
          <Text style={styles.btnText}>Archive Visible</Text>
        </EasyButton>
        <EasyButton secondary medium onPress={() => bulkArchiveCategories(false)}>
          <Text style={styles.btnText}>Restore Visible</Text>
        </EasyButton>
      </View>

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

      {editingId ? (
        <View style={styles.editCard}>
          <Text style={styles.editTitle}>Edit Genre</Text>
          <TextInput
            value={editName}
            onChangeText={setEditName}
            placeholder="Genre name"
            style={[styles.input, styles.editInput]}
          />
          <TextInput
            value={editDescription}
            onChangeText={setEditDescription}
            placeholder="Genre description"
            style={[styles.input, styles.descriptionInput, styles.editInput]}
            multiline
          />
          <View style={styles.editActionsRow}>
            <EasyButton secondary medium onPress={saveEdit}>
              <Text style={styles.btnText}>Save</Text>
            </EasyButton>
            <EasyButton danger medium onPress={cancelEdit}>
              <Text style={styles.btnText}>Cancel</Text>
            </EasyButton>
          </View>
        </View>
      ) : null}

      <FlatList
        data={filteredCategories}
        keyExtractor={(item) => item.id || item._id}
        ListEmptyComponent={<Text style={styles.emptyText}>No genres in this tab.</Text>}
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              {item.description ? (
                <Text style={styles.itemDescription}>{item.description}</Text>
              ) : null}
              <Text style={styles.itemState}>State: {item?.isArchived ? "Archived" : "Active"}</Text>
            </View>
            <View>
              <EasyButton secondary medium onPress={() => startEdit(item)}>
                <Text style={styles.btnText}>Edit</Text>
              </EasyButton>
              <EasyButton danger medium onPress={() => toggleArchiveCategory(item)}>
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
  title: { fontSize: 20, fontWeight: "700", marginBottom: 6 },
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
  searchWrap: { marginBottom: 8 },
  searchLabel: { fontWeight: "700", color: "#344e41", marginBottom: 6 },
  tabRow: { flexDirection: "row", justifyContent: "center", marginBottom: 10 },
  bulkRow: { flexDirection: "row", justifyContent: "center", marginBottom: 10 },
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
  itemState: {
    color: "#495057",
    marginTop: 4,
  },
  descriptionInput: {
    minHeight: 80,
    textAlignVertical: "top",
    marginBottom: 12,
    paddingTop: 10,
  },
  searchInput: {
    marginRight: 0,
    marginBottom: 12,
  },
  editCard: {
    borderWidth: 1,
    borderColor: "#ececec",
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    backgroundColor: "#f8fbfd",
  },
  editTitle: { fontWeight: "700", marginBottom: 8, color: "#133c55" },
  editInput: { marginRight: 0 },
  editActionsRow: { flexDirection: "row", justifyContent: "center" },
  emptyText: { textAlign: "center", color: "#6c757d", marginTop: 25 },
  btnText: { color: "white", fontWeight: "700" },
});

export default Categories;
