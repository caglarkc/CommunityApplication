import 'package:flutter/material.dart';
import 'core/theme/app_theme.dart';
import 'screens/auth/register_screen.dart';

void main() {
  runApp(const ToplulukApp());
}

class ToplulukApp extends StatelessWidget {
  const ToplulukApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Topluluk App',
      theme: AppTheme.lightTheme,
      home: const RegisterScreen(),
      debugShowCheckedModeBanner: false,
    );
  }
}
