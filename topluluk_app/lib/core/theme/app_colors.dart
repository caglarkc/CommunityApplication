import 'package:flutter/material.dart';

class AppColors {
  // Primary Colors
  static const Color primary = Color(0xFF2196F3);
  static const Color secondary = Color(0xFF64B5F6);
  static const Color background = Color(0xFFF8F9FA);
  static const Color surface = Colors.white;
  
  // Text Colors
  static const Color textPrimary = Color(0xFF2B2B2B);
  static const Color textSecondary = Color(0xFF757575);
  static const Color textDisabled = Color(0xFFBDBDBD);
  
  // Status Colors
  static const Color success = Color(0xFF4CAF50);
  static const Color error = Color(0xFFF44336);
  static const Color warning = Color(0xFFFFA726);
  static const Color info = Color(0xFF2196F3);

  // Light Theme Text Colors (backward compatibility)
  static const Color lightThemeTextColor = textPrimary;
  static const Color lightThemeHintColor = textSecondary;
  static const Color lightThemeLabelColor = Color(0xFF424242);

  // Dark Theme Text Colors
  static const Color darkThemeTextColor = Color(0xFFF5F5F5);
  static const Color darkThemeHintColor = Color(0xFFBDBDBD);
  static const Color darkThemeLabelColor = Color(0xFFE0E0E0);

  // Form Field Colors
  static const Color lightThemeFormFieldBorder = Color(0xFFE0E0E0);
  static const Color darkThemeFormFieldBorder = Color(0xFF424242);
  static const Color lightThemeFormFieldUnfocused = Color(0xFFE3F2FD); // Soluk mavi
  static const Color lightThemeFormFieldBackground = Color(0xFFF5F5F5);
  
  // Focus Colors
  static const Color lightThemeFocusColor = primary;
  static const Color darkThemeFocusColor = secondary;

  // Button Colors
  static const Color buttonPrimaryColor = primary;
  static const Color buttonSecondaryColor = secondary;
  static const Color buttonDisabledColor = Color(0xFFBDBDBD);
  static const Color buttonTextColor = Colors.white;
  static const Color buttonShadowColor = Color(0x29000000); // %16 opacity

  // Common Colors (backward compatibility)
  static const Color successColor = success;
  static const Color errorColor = error;
  static const Color warningColor = warning;
  static const Color infoColor = info;
} 