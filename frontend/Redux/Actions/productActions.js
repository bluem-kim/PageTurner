import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

import baseURL from "../../assets/common/baseurl";
import {
  PRODUCTS_REQUEST,
  PRODUCTS_SUCCESS,
  PRODUCTS_FAIL,
  PRODUCT_ARCHIVE_SUCCESS,
} from "../constants";

export const fetchProducts = (options = {}) => async (dispatch) => {
  dispatch({ type: PRODUCTS_REQUEST });
  try {
    const query = [];
    if (options?.includeArchived) query.push("includeArchived=1");
    if (options?.archivedOnly) query.push("archived=1");

    const suffix = query.length ? `?${query.join("&")}` : "";
    const res = await axios.get(`${baseURL}products${suffix}`);
    dispatch({ type: PRODUCTS_SUCCESS, payload: res.data || [] });
  } catch (error) {
    dispatch({
      type: PRODUCTS_FAIL,
      payload: error?.response?.data?.message || "Failed to load products",
    });
  }
};

export const archiveProduct = (productId, isArchived = true) => async (dispatch) => {
  const token = await AsyncStorage.getItem("jwt");
  await axios.put(
    `${baseURL}products/${productId}/archive`,
    { isArchived },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  dispatch({ type: PRODUCT_ARCHIVE_SUCCESS, payload: { productId, isArchived } });
};

// Backward-compatible alias for legacy imports.
export const deleteProduct = (productId) => async (dispatch) => {
  const token = await AsyncStorage.getItem("jwt");
  await axios.put(
    `${baseURL}products/${productId}/archive`,
    { isArchived: true },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  dispatch({ type: PRODUCT_ARCHIVE_SUCCESS, payload: { productId, isArchived: true } });
};
