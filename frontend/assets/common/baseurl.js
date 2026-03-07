import { Platform } from "react-native";

// Android emulator must use 10.0.2.2 to reach localhost on your PC.
// For a physical phone, change LAN_IP to your computer's IPv4 address.
const LAN_IP = "192.168.1.100";

const baseURL = Platform.select({
  android: "http://10.0.2.2:4000/api/v1/",
  ios: `http://${LAN_IP}:4000/api/v1/`,
  default: `http://${LAN_IP}:4000/api/v1/`,
});

export default baseURL;
