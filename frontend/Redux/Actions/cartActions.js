import {
  ADD_TO_CART,
  REMOVE_FROM_CART,
  REMOVE_SELECTED_FROM_CART,
  CLEAR_CART,
  HYDRATE_CART,
} from "../constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { clearCartDb, loadCartFromDb, saveCartToDb } from "../../utils/cartStorage";

const createCartLineId = () => `line-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const withCartLineId = (item) => ({
  ...item,
  cartLineId: item?.cartLineId || createCartLineId(),
});

const getActiveOwnerKey = async () => {
  const profileRaw = await AsyncStorage.getItem("userProfile");
  if (!profileRaw) return "guest";

  try {
    const profile = JSON.parse(profileRaw);
    return String(profile?.userId || "guest");
  } catch (error) {
    return "guest";
  }
};

export const addToCart = (payload) => async (dispatch, getState) => {
  dispatch({ type: ADD_TO_CART, payload: withCartLineId(payload) });
  const ownerKey = await getActiveOwnerKey();
  await saveCartToDb(getState().cartItems, ownerKey);
};

export const removeFromCart = (payload) => async (dispatch, getState) => {
  dispatch({ type: REMOVE_FROM_CART, payload });
  const ownerKey = await getActiveOwnerKey();
  await saveCartToDb(getState().cartItems, ownerKey);
};

export const removeSelectedFromCart = (lineIds = []) => async (dispatch, getState) => {
  dispatch({ type: REMOVE_SELECTED_FROM_CART, payload: lineIds });
  const ownerKey = await getActiveOwnerKey();
  await saveCartToDb(getState().cartItems, ownerKey);
};

export const clearCart = () => async (dispatch) => {
  dispatch({ type: CLEAR_CART });
  const ownerKey = await getActiveOwnerKey();
  await clearCartDb(ownerKey);
};

export const loadCartFromStorage = () => async (dispatch) => {
  try {
    const ownerKey = await getActiveOwnerKey();
    const parsed = await loadCartFromDb(ownerKey);
    const sanitized = (Array.isArray(parsed) ? parsed : []).map(withCartLineId);
    dispatch({ type: HYDRATE_CART, payload: sanitized });
    await saveCartToDb(sanitized, ownerKey);
  } catch (error) {
    dispatch({ type: HYDRATE_CART, payload: [] });
  }
};