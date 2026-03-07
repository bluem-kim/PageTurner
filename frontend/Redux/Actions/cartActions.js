import { ADD_TO_CART, REMOVE_FROM_CART, CLEAR_CART, HYDRATE_CART } from "../constants";
import { clearCartDb, loadCartFromDb, saveCartToDb } from "../../utils/cartStorage";

export const addToCart = (payload) => async (dispatch, getState) => {
  dispatch({ type: ADD_TO_CART, payload });
  await saveCartToDb(getState().cartItems);
};

export const removeFromCart = (payload) => async (dispatch, getState) => {
  dispatch({ type: REMOVE_FROM_CART, payload });
  await saveCartToDb(getState().cartItems);
};

export const clearCart = () => async (dispatch) => {
  dispatch({ type: CLEAR_CART });
  await clearCartDb();
};

export const loadCartFromStorage = () => async (dispatch) => {
  try {
    const parsed = await loadCartFromDb();
    dispatch({ type: HYDRATE_CART, payload: Array.isArray(parsed) ? parsed : [] });
  } catch (error) {
    dispatch({ type: HYDRATE_CART, payload: [] });
  }
};