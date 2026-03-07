import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { Provider, useDispatch } from "react-redux";
import Toast from "react-native-toast-message";

import Main from "./Navigators/Main";
import Auth from "./Context/Store/Auth";
import store from "./Redux/store";
import { loadCartFromStorage } from "./Redux/Actions/cartActions";

const AppContent = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(loadCartFromStorage());
  }, [dispatch]);

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
