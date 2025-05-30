import 'package:flutter/material.dart';
import 'app_colors.dart';

class AppText extends StatelessWidget {
  final String text;
  final double? fontSize;
  final FontWeight? fontWeight;
  final Color? color;
  final TextAlign? textAlign;
  final int? maxLines;
  final TextOverflow? overflow;

  // Başlık için
  const AppText.heading({
    super.key,
    required this.text,
    this.color = Colors.black87,
    this.fontSize = 32,
    this.fontWeight = FontWeight.bold,
    this.textAlign,
    this.maxLines,
    this.overflow,
  });

  // Alt başlık için
  const AppText.subheading({
    super.key,
    required this.text,
    this.fontSize = 16,
    this.fontWeight = FontWeight.normal,
    this.textAlign,
    this.maxLines,
    this.overflow,
    this.color = AppColors.lightThemeHintColor,
  });

  // Link text için
  const AppText.link({
    super.key,
    required this.text,
    this.fontSize = 16,
    this.fontWeight = FontWeight.w600,
    this.textAlign,
    this.maxLines,
    this.overflow,
    this.color = AppColors.buttonPrimaryColor,
  });

  // Normal text için
  const AppText.body({
    super.key,
    required this.text,
    this.color = Colors.black87,
    this.fontSize = 14,
    this.fontWeight = FontWeight.normal,
    this.textAlign,
    this.maxLines,
    this.overflow,
  });

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: TextStyle(
        color: color,
        fontSize: fontSize,
        fontWeight: fontWeight,
      ),
      textAlign: textAlign,
      maxLines: maxLines,
      overflow: overflow,
    );
  }
} 