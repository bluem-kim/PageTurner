import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

import baseURL from "../../assets/common/baseurl";
import {
  MY_REVIEWS_REQUEST,
  MY_REVIEWS_SUCCESS,
  MY_REVIEWS_FAIL,
  MY_REVIEW_DELETE_SUCCESS,
  MY_REVIEW_UPSERT_SUCCESS,
  ADMIN_REVIEWS_REQUEST,
  ADMIN_REVIEWS_SUCCESS,
  ADMIN_REVIEWS_FAIL,
  ADMIN_REVIEW_ARCHIVE_SUCCESS,
  ADMIN_REVIEWS_BULK_ARCHIVE_SUCCESS,
} from "../constants";

export const fetchMyReviews = () => async (dispatch) => {
  dispatch({ type: MY_REVIEWS_REQUEST });
  try {
    const token = await AsyncStorage.getItem("jwt");
    const res = await axios.get(`${baseURL}products/reviews/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    dispatch({ type: MY_REVIEWS_SUCCESS, payload: res.data || [] });
  } catch (error) {
    dispatch({
      type: MY_REVIEWS_FAIL,
      payload: error?.response?.data?.message || "Failed to load reviews",
    });
  }
};

export const deleteMyReview = (productId) => async (dispatch) => {
  const token = await AsyncStorage.getItem("jwt");
  await axios.delete(`${baseURL}products/${productId}/reviews/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  dispatch({ type: MY_REVIEW_DELETE_SUCCESS, payload: productId });
};

export const fetchAdminReviews = () => async (dispatch) => {
  dispatch({ type: ADMIN_REVIEWS_REQUEST });
  try {
    const token = await AsyncStorage.getItem("jwt");
    const res = await axios.get(`${baseURL}products/reviews/admin?includeArchived=1`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    dispatch({ type: ADMIN_REVIEWS_SUCCESS, payload: res.data || [] });
  } catch (error) {
    dispatch({
      type: ADMIN_REVIEWS_FAIL,
      payload: error?.response?.data?.message || "Failed to load reviews",
    });
  }
};

export const archiveAdminReview = ({ productId, reviewId, isArchived }) => async (dispatch) => {
  const token = await AsyncStorage.getItem("jwt");
  await axios.put(
    `${baseURL}products/${productId}/reviews/${reviewId}/archive`,
    { isArchived },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  dispatch({
    type: ADMIN_REVIEW_ARCHIVE_SUCCESS,
    payload: { productId, reviewId, isArchived },
  });
};

export const bulkArchiveAdminReviews = ({ items = [], isArchived }) => async (dispatch) => {
  const token = await AsyncStorage.getItem("jwt");
  await axios.put(
    `${baseURL}products/reviews/admin/archive/bulk`,
    {
      isArchived,
      items,
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  dispatch({
    type: ADMIN_REVIEWS_BULK_ARCHIVE_SUCCESS,
    payload: {
      isArchived,
      items,
    },
  });
};

export const submitReview = ({ productId, orderId, rating, comment, existingImages, newImages }) => async (dispatch) => {
  const token = await AsyncStorage.getItem("jwt");

  const payload = new FormData();
  payload.append("orderId", orderId);
  payload.append("rating", String(rating));
  payload.append("comment", String(comment || "").trim());
  payload.append("existingImages", JSON.stringify(existingImages || []));

  (newImages || []).forEach((asset, index) => {
    payload.append("images", {
      uri: asset.uri,
      name: asset.fileName || `review-${Date.now()}-${index}.jpg`,
      type: asset.mimeType || "image/jpeg",
    });
  });

  const response = await fetch(`${baseURL}products/${productId}/reviews`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: payload,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || "Review failed");
  }

  dispatch({ type: MY_REVIEW_UPSERT_SUCCESS, payload: { productId } });
  await dispatch(fetchMyReviews());

  return data;
};
