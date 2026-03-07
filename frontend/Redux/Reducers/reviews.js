import {
  MY_REVIEWS_REQUEST,
  MY_REVIEWS_SUCCESS,
  MY_REVIEWS_FAIL,
  MY_REVIEW_DELETE_SUCCESS,
} from "../constants";

const initialState = {
  myReviews: [],
  loading: false,
  error: "",
};

const reviewsReducer = (state = initialState, action) => {
  switch (action.type) {
    case MY_REVIEWS_REQUEST:
      return { ...state, loading: true, error: "" };
    case MY_REVIEWS_SUCCESS:
      return { ...state, loading: false, myReviews: action.payload || [], error: "" };
    case MY_REVIEWS_FAIL:
      return { ...state, loading: false, error: action.payload || "Failed to load reviews" };
    case MY_REVIEW_DELETE_SUCCESS:
      return {
        ...state,
        myReviews: (state.myReviews || []).filter(
          (item) => String(item.productId) !== String(action.payload)
        ),
      };
    default:
      return state;
  }
};

export default reviewsReducer;
