import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

import baseURL from "../../assets/common/baseurl";
import {
  PRODUCTS_REQUEST,
  PRODUCTS_SUCCESS,
  PRODUCTS_FAIL,
  PRODUCT_DELETE_SUCCESS,
} from "../constants";

export const fetchProducts = () => async (dispatch) => {
  dispatch({ type: PRODUCTS_REQUEST });
  try {
    const res = await axios.get(`${baseURL}products`);
    dispatch({ type: PRODUCTS_SUCCESS, payload: res.data || [] });
  } catch (error) {
    dispatch({
      type: PRODUCTS_FAIL,
      payload: error?.response?.data?.message || "Failed to load products",
    });
  }
};

export const deleteProduct = (productId) => async (dispatch) => {
  const token = await AsyncStorage.getItem("jwt");
  await axios.delete(`${baseURL}products/${productId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  dispatch({ type: PRODUCT_DELETE_SUCCESS, payload: productId });
};
