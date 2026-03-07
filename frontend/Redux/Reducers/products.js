import {
  PRODUCTS_REQUEST,
  PRODUCTS_SUCCESS,
  PRODUCTS_FAIL,
  PRODUCT_DELETE_SUCCESS,
} from "../constants";

const initialState = {
  items: [],
  loading: false,
  error: "",
};

const productsReducer = (state = initialState, action) => {
  switch (action.type) {
    case PRODUCTS_REQUEST:
      return { ...state, loading: true, error: "" };
    case PRODUCTS_SUCCESS:
      return { ...state, loading: false, items: action.payload || [], error: "" };
    case PRODUCTS_FAIL:
      return { ...state, loading: false, error: action.payload || "Failed to load products" };
    case PRODUCT_DELETE_SUCCESS:
      return {
        ...state,
        items: (state.items || []).filter(
          (item) => String(item.id || item._id) !== String(action.payload)
        ),
      };
    default:
      return state;
  }
};

export default productsReducer;
