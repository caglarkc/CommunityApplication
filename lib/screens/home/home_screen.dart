import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text.dart';
import '../../services/auth_service.dart';
import '../auth/login_screen.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Topluluk'),
        backgroundColor: AppColors.buttonPrimaryColor,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () => _logout(context),
          ),
        ],
      ),
      body: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.group_rounded,
              size: 80,
              color: AppColors.buttonPrimaryColor,
            ),
            SizedBox(height: 20),
            AppText.heading(
              text: 'Hoş Geldin!',
              fontSize: 24,
            ),
            SizedBox(height: 10),
            AppText.body(
              text: 'Ana sayfa geliştirilmeye devam ediyor...',
              fontSize: 16,
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _logout(BuildContext context) async {
    try {
      // Loading göster
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => const Center(
          child: CircularProgressIndicator(),
        ),
      );

      // AuthService ile logout yap
      await AuthService().logout();
      
      // Loading'i kapat
      if (context.mounted) Navigator.of(context).pop();
      
      // Login sayfasına yönlendir
      if (context.mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (context) => const LoginScreen()),
        );
      }
      
    } catch (e) {
      // Loading'i kapat
      if (context.mounted) Navigator.of(context).pop();
      
      // Hata mesajı göster
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Çıkış hatası: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }
}
