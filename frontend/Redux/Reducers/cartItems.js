import { ADD_TO_CART, REMOVE_FROM_CART, CLEAR_CART, HYDRATE_CART } from "../constants";

const cartItems = (state = [], action) => {
  switch (action.type) {
    case ADD_TO_CART:
      return [...state, action.payload];
    case REMOVE_FROM_CART:
      return state.filter((item) => {
        const currentId = item.id || item._id;
        const targetId = action.payload.id || action.payload._id;
        return currentId !== targetId;
      });
    case CLEAR_CART:
      return [];
    case HYDRATE_CART:
      return Array.isArray(action.payload) ? action.payload : [];
    default:
      return state;
  }
};

export default cartItems;