import { StatusBar } from "expo-status-bar";
import { useContext, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { Provider, useDispatch } from "react-redux";
import Toast from "react-native-toast-message";

import Main from "./Navigators/Main";
import Auth from "./Context/Store/Auth";
import AuthGlobal from "./Context/Store/AuthGlobal";
import store from "./Redux/store";
import { clearCart, loadCartFromStorage } from "./Redux/Actions/cartActions";

const AppContent = () => {
  const dispatch = useDispatch();
  const auth = useContext(AuthGlobal);
  const isAuthenticated = auth?.stateUser?.isAuthenticated;

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(loadCartFromStorage());
      return;
    }
    dispatch(clearCart());
  }, [dispatch, isAuthenticated]);

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Main />
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <Auth>
      <Provider store={store}>
        <AppContent />
        <Toast />
      </Provider>
    </Auth>
  );
}
