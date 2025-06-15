import 'package:flutter/material.dart';
import 'app_colors.dart';

class AppTheme {
  // Renkler
  static const Color primaryColor = AppColors.buttonPrimaryColor;
  static const Color backgroundColor = Color(0xFFF5F5F5);
  static const Color cardColor = Colors.white;
  static const Color textPrimaryColor = AppColors.lightThemeTextColor;
  static const Color textSecondaryColor = AppColors.lightThemeHintColor;
  static const Color errorColor = AppColors.errorColor;
  static const Color successColor = AppColors.successColor;

  // Ana tema
  static ThemeData get lightTheme {
    return ThemeData(
      colorScheme: ColorScheme.fromSeed(
        seedColor: primaryColor,
        brightness: Brightness.light,
      ),
      useMaterial3: true,
      scaffoldBackgroundColor: backgroundColor,
      
      // AppBar tema
      appBarTheme: const AppBarTheme(
        backgroundColor: primaryColor,
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
      ),
      
      // Elevated Button tema
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.buttonPrimaryColor,
          foregroundColor: AppColors.buttonTextColor,
          disabledBackgroundColor: AppColors.buttonDisabledColor,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
          elevation: 2,
          shadowColor: AppColors.buttonShadowColor,
        ),
      ),
      
      // Input Decoration tema
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.lightThemeFormFieldUnfocused,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.lightThemeFormFieldBorder),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.lightThemeFormFieldBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.lightThemeFocusColor, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.errorColor),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        hintStyle: TextStyle(color: AppColors.lightThemeHintColor),
        labelStyle: TextStyle(color: AppColors.lightThemeLabelColor),
      ),
    );
  }
}
