import { scale, verticalScale } from "@/utils/styling";

export const colors = {
  primary: "#EAB308",        // Yellow-500 (Warm, professional yellow)
  primaryLight: "#FACC15",   // Yellow-400
  primaryDark: "#CA8A04",     // Blue-900
  text: "#fff",
  textLight: "#e5e5e5",
  textLighter: "#d4d4d4",
  white: "#ffffff",
  black: "#000000",
  rose: "#dc2626",            // Red-600 (Error/Alert)
  green: "#15803d",           // Green-700 (Success)
  neutral50: "#f9fafb",
  neutral100: "#f3f4f6",
  neutral200: "#e5e7eb",
  neutral300: "#d1d5db",
  neutral350: "#cbd5e1",
  neutral400: "#9ca3af",
  neutral500: "#6b7280",
  neutral600: "#4b5563",
  neutral700: "#374151",
  neutral800: "#1f2937",
  neutral900: "#111827",
  error: "#dc2626",            // Added for error color
  errorLight: "#fca5a5",      // Optional: Lighter shade for error backgrounds
};

export const spacingX = {
  _3: scale(3),
  _5: scale(5),
  _7: scale(7),
  _10: scale(10),
  _12: scale(12),
  _15: scale(15),
  _20: scale(20),
  _25: scale(25),
  _30: scale(30),
  _35: scale(35),
  _40: scale(40),
  _8: scale(8),           // Added spacingX._8
};

export const spacingY = {
  _3: verticalScale(3),    // Added spacingY._3
  _5: verticalScale(5),
  _7: verticalScale(7),
  _8: verticalScale(8),    // Added spacingY._8
  _10: verticalScale(10),
  _12: verticalScale(12),
  _15: verticalScale(15),
  _17: verticalScale(17),
  _20: verticalScale(20),
  _25: verticalScale(25),
  _30: verticalScale(30),
  _35: verticalScale(35),
  _40: verticalScale(40),
  _50: verticalScale(50),
  _60: verticalScale(60),
};

export const radius = {
  _3: verticalScale(3),
  _5: verticalScale(5), //Added radius._5
  _6: verticalScale(6),
  _8: verticalScale(8),    // Added radius._8
  _10: verticalScale(10),
  _12: verticalScale(12),
  _15: verticalScale(15),
  _17: verticalScale(17),
  _20: verticalScale(20),
  _30: verticalScale(30),
};