import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native";

const CategoryFilter = ({ categories, active, onChange }) => {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.row}>
      <TouchableOpacity
        onPress={() => onChange("all")}
        style={[styles.badge, active === "all" ? styles.active : styles.inactive]}
      >
        <Text style={styles.badgeText}>All</Text>
      </TouchableOpacity>
      {categories.map((item) => (
        <TouchableOpacity
          key={item.id || item._id}
          onPress={() => onChange(item.id || item._id)}
          style={[
            styles.badge,
            active === (item.id || item._id) ? styles.active : styles.inactive,
          ]}
        >
          <Text style={styles.badgeText}>{item.name}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  row: {
    marginVertical: 10,
    paddingHorizontal: 10,
  },
  badge: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
  },
  active: {
    backgroundColor: "#1f8a70",
  },
  inactive: {
    backgroundColor: "#6c757d",
  },
  badgeText: {
    color: "white",
    fontWeight: "700",
  },
});

export default CategoryFilter;