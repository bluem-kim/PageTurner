import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import Toast from "react-native-toast-message";
import axios from "axios";

import Header from "../../Shared/Header";
import CategoryFilter from "./CategoryFilter";
import ProductList from "./ProductList";
import { addToCart } from "../../Redux/Actions/cartActions";
import { fetchProducts } from "../../Redux/Actions/productActions";
import baseURL from "../../assets/common/baseurl";
import AuthGlobal from "../../Context/Store/AuthGlobal";

const PRICE_RANGES = [
  { key: "all", label: "All Prices", min: 0, max: Number.POSITIVE_INFINITY },
  { key: "0-299", label: "Up to PHP 299", min: 0, max: 299 },
  { key: "300-599", label: "PHP 300 - 599", min: 300, max: 599 },
  { key: "600-999", label: "PHP 600 - 999", min: 600, max: 999 },
  { key: "1000+", label: "PHP 1000+", min: 1000, max: Number.POSITIVE_INFINITY },
];

const ProductContainer = ({ navigation }) => {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activePriceRange, setActivePriceRange] = useState("all");
  const [categories, setCategories] = useState([]);
  const { items: products, loading, error } = useSelector((state) => state.products);
  const dispatch = useDispatch();
  const authContext = useContext(AuthGlobal);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      dispatch(fetchProducts());

      try {
        const categoriesRes = await axios.get(`${baseURL}categories`);
        if (!mounted) return;
        setCategories(categoriesRes.data || []);
      } catch (error) {
        Toast.show({
          type: "info",
          text1: "Genres unavailable",
          text2: "Products are loaded, but genre filter is unavailable",
          topOffset: 60,
        });
      }
    };

    loadData();
    return () => {
      mounted = false;
    };
  }, [dispatch]);

  useEffect(() => {
    if (!error) return;
    Toast.show({
      type: "error",
      text1: "Unable to load catalog",
      text2: error,
      topOffset: 60,
    });
  }, [error]);

  const filtered = useMemo(() => {
    const selectedRange = PRICE_RANGES.find((r) => r.key === activePriceRange) || PRICE_RANGES[0];

    const byCategory = activeCategory === "all"
      ? products
      : products.filter((p) => {
          const selectedId = String(activeCategory);
          const getId = (value) => {
            if (!value) return "";
            if (typeof value === "object") {
              return String(value.id || value._id || "");
            }
            return String(value);
          };

          const genreId = typeof p.genre === "object"
            ? p.genre?.id || p.genre?._id
            : p.genre;
          if (genreId && String(genreId) === selectedId) return true;

          const categoryParentId = typeof p.category === "object"
            ? p.category?.parent?.id || p.category?.parent?._id || p.category?.parent
            : null;

          if (categoryParentId && String(categoryParentId) === selectedId) return true;

          const categoryId = getId(p.category);
          if (categoryId && categoryId === selectedId) return true;

          const matchesSubGenre = Array.isArray(p.subGenres)
            ? p.subGenres.some((sub) => {
                const subId = getId(sub);
                const subParentId = getId(sub?.parent);
                return subId === selectedId || subParentId === selectedId;
              })
            : false;

          return matchesSubGenre;
        });

    const bySearch = byCategory.filter((p) =>
      String(p.name || "").toLowerCase().includes(query.toLowerCase().trim())
    );

    const byPrice = bySearch.filter((p) => {
      const price = Number(p.price || 0);
      if (price < selectedRange.min) return false;
      if (price > selectedRange.max) return false;
      return true;
    });

    return [...byPrice].sort((a, b) => {
      const purchasesA = Number(a.purchasedCount || 0);
      const purchasesB = Number(b.purchasedCount || 0);
      if (purchasesA !== purchasesB) {
        return purchasesB - purchasesA;
      }

      return String(a.name || "").localeCompare(String(b.name || ""), undefined, {
        sensitivity: "base",
      });
    });
  }, [query, activeCategory, activePriceRange, products]);

  const clearFilters = () => {
    setQuery("");
    setActiveCategory("all");
    setActivePriceRange("all");
  };

  const handleAdd = (item) => {
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
      text2: "Open Cart to review your order",
      topOffset: 60,
    });
  };

  return (
    <View style={styles.screen}>
      <Header title="PageTurner Shop" />
      <View style={styles.searchWrap}>
        <TextInput
          placeholder="Search products"
          value={query}
          onChangeText={setQuery}
          style={styles.search}
        />

        <View style={styles.priceWrap}>
          {PRICE_RANGES.map((range) => {
            const active = activePriceRange === range.key;
            return (
              <TouchableOpacity
                key={range.key}
                style={[styles.priceChip, active && styles.priceChipActive]}
                onPress={() => setActivePriceRange(range.key)}
              >
                <Text style={[styles.priceChipText, active && styles.priceChipTextActive]}>
                  {range.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={styles.clearBtn} onPress={clearFilters}>
          <Text style={styles.clearBtnText}>Clear Filters</Text>
        </TouchableOpacity>
      </View>
      <CategoryFilter
        categories={categories}
        active={activeCategory}
        onChange={setActiveCategory}
      />

      {loading ? (
        <View style={styles.emptyWrap}>
          <ActivityIndicator size="large" color="#1f8a70" />
        </View>
      ) : null}

      {!loading && filtered.length ? (
        <FlatList
          contentContainerStyle={styles.list}
          data={filtered}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: "space-between" }}
          renderItem={({ item }) => (
            <ProductList item={item} navigation={navigation} onAdd={handleAdd} />
          )}
          keyExtractor={(item, index) => String(item.id || item._id || index)}
        />
      ) : !loading ? (
        <View style={styles.emptyWrap}>
          <Text>No products found</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f7f7f7",
  },
  searchWrap: {
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  search: {
    backgroundColor: "white",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    paddingHorizontal: 12,
    height: 44,
  },
  priceWrap: {
    marginTop: 8,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  priceChip: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ced4da",
    backgroundColor: "#f1f3f5",
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  priceChipActive: {
    borderColor: "#1f8a70",
    backgroundColor: "#1f8a70",
  },
  priceChipText: {
    color: "#495057",
    fontWeight: "600",
  },
  priceChipTextActive: {
    color: "white",
    fontWeight: "700",
  },
  clearBtn: {
    marginTop: 8,
    alignSelf: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: "#6c757d",
  },
  clearBtnText: {
    color: "white",
    fontWeight: "700",
  },
  list: {
    paddingHorizontal: 10,
    paddingBottom: 24,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default ProductContainer;