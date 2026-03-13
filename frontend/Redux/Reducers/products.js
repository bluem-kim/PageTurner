import {
  PRODUCTS_REQUEST,
  PRODUCTS_SUCCESS,
  PRODUCTS_FAIL,
  PRODUCT_ARCHIVE_SUCCESS,
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
    case PRODUCT_ARCHIVE_SUCCESS:
      return {
        ...state,
        items: (state.items || []).map((item) => {
          const id = String(item.id || item._id);
          const targetId = String(action.payload?.productId);
          if (id !== targetId) return item;
          return { ...item, isArchived: Boolean(action.payload?.isArchived) };
        }),
      };
    default:
      return state;
  }
};

export default productsReducer;
