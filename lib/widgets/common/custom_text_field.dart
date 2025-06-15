import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';

class CustomTextField extends StatefulWidget {
  final TextEditingController controller;
  final String label;
  final IconData icon;
  final bool obscureText;
  final Widget? suffixIcon;
  final TextInputType? keyboardType;
  final String? Function(String?)? validator;
  final VoidCallback? onTap;
  final int? maxLines;
  final bool isRequired;

  const CustomTextField({
    super.key,
    required this.controller,
    required this.label,
    required this.icon,
    this.obscureText = false,
    this.suffixIcon,
    this.keyboardType,
    this.validator,
    this.onTap,
    this.maxLines = 1,
    this.isRequired = false,
  });

  @override
  State<CustomTextField> createState() => _CustomTextFieldState();
}

class _CustomTextFieldState extends State<CustomTextField> {
  late FocusNode _focusNode;
  bool _isFocused = false;

  @override
  void initState() {
    super.initState();
    _focusNode = FocusNode();
    _focusNode.addListener(() {
      setState(() {
        _isFocused = _focusNode.hasFocus;
        if (_isFocused && widget.onTap != null) {
          widget.onTap!();
        }
      });
    });
  }

  @override
  void dispose() {
    _focusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: widget.controller,
      obscureText: widget.obscureText,
      keyboardType: widget.keyboardType,
      validator: widget.validator,
      focusNode: _focusNode,
      maxLines: widget.maxLines,
      decoration: InputDecoration(
        label: widget.isRequired 
            ? RichText(
                text: TextSpan(
                  children: [
                    TextSpan(
                      text: widget.label,
                      style: TextStyle(
                        color: _isFocused ? AppColors.lightThemeFocusColor : AppColors.lightThemeLabelColor,
                        fontSize: 16,
                      ),
                    ),
                    const TextSpan(
                      text: ' *',
                      style: TextStyle(
                        color: Colors.red,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              )
            : null,
        labelText: widget.isRequired ? null : widget.label,
        labelStyle: widget.isRequired ? null : TextStyle(
          color: _isFocused ? AppColors.lightThemeFocusColor : AppColors.lightThemeLabelColor,
        ),
        prefixIcon: Icon(
          widget.icon,
          color: _isFocused ? AppColors.lightThemeFocusColor : AppColors.lightThemeHintColor,
        ),
        suffixIcon: widget.suffixIcon,
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(
            color: _isFocused ? AppColors.lightThemeFocusColor : AppColors.lightThemeFormFieldBorder.withOpacity(0.5),
          ),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(
            color: AppColors.lightThemeFormFieldBorder.withOpacity(0.5),
          ),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(
            color: AppColors.lightThemeFocusColor,
            width: 2,
          ),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.errorColor),
        ),
      ),
    );
  }
}
