import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import '../services/token_service.dart';
import '../core/theme/app_colors.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  
  final AuthService _authService = AuthService();

  @override
  void initState() {
    super.initState();
    _initializeAnimations();
    _performAuthCheck();
  }

  void _initializeAnimations() {
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    );

    _fadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeInOut,
    ));

    _animationController.forward();
  }

  Future<void> _performAuthCheck() async {
    try {
      // Minimum splash time için bekle
      await Future.delayed(const Duration(seconds: 2));
      
      print('🚀 SplashScreen: Auth check başlatılıyor...');
      
      // DEBUG: Token durumunu detaylı kontrol et
      await TokenService.printStoredTokens();
      
      // Auth durumu kontrol et
      final authResult = await _authService.checkAuthStatus();
      
      if (!mounted) return;

      if (authResult.isValid) {
        // ✅ Auth geçerli - Home'a git
        print('✅ Auth geçerli, Home ekranına yönlendiriliyor...');
        _navigateToHome();
      } else {
        // ❌ Auth geçersiz
        print('❌ Auth geçersiz: ${authResult.reason}');
        
        // Token temizleme gerekiyorsa
        if (authResult.shouldClearToken) {
          await TokenService.clearAllTokens();
          print('🗑️ Token temizlendi');
        }
        
        // Spesifik reason'lara göre yönlendirme
        if (authResult.reason == 'user_not_verified') {
          // Email doğrulanmamış ama token var - logout yap ve login'e yönlendir
          print('⚠️ Email doğrulanmamış, logout yapılıyor...');
          await _performLogout();
          _navigateToLogin('Hesabınız doğrulanmamış. Lütfen email doğrulaması yapın.');
        } else {
          // Diğer durumlar için login'e git
          _navigateToLogin(authResult.message);
        }
      }
    } catch (e) {
      print('❌ SplashScreen error: $e');
      // Hata durumunda da login'e git
      _navigateToLogin('Beklenmeyen hata oluştu');
    }
  }

  void _navigateToHome() {
    Navigator.of(context).pushReplacementNamed('/home');
  }

  void _navigateToLogin([String? message]) {
    Navigator.of(context).pushReplacementNamed('/login');
    
    // Hata mesajı varsa göster
    if (message != null && message.isNotEmpty) {
      Future.delayed(const Duration(milliseconds: 500), () {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(message),
              backgroundColor: AppColors.error,
              duration: const Duration(seconds: 3),
            ),
          );
        }
      });
    }
  }

  Future<void> _performLogout() async {
    try {
      print('🚪 SplashScreen: Logout başlatılıyor...');
      
      // Token kontrol et
      final storedToken = await TokenService.getAccessToken();
      if (storedToken != null) {
        // Token varsa backend logout yap
        await AuthService().logout();
        print('✅ Splash logout completed');
      } else {
        // Token yoksa sadece frontend temizle
        await TokenService.clearAllTokens();
        print('🗑️ No token found, cleared local storage');
      }
    } catch (e) {
      print('❌ Splash logout error: $e');
      // Hata durumunda da frontend token'ları temizle
      await TokenService.clearAllTokens();
      print('🗑️ Fallback: Tokenlar temizlendi');
    }
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              AppColors.primary.withOpacity(0.1),
              AppColors.background,
              AppColors.secondary.withOpacity(0.1),
            ],
          ),
        ),
        child: Center(
          child: FadeTransition(
            opacity: _fadeAnimation,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Logo
                Container(
                  width: 120,
                  height: 120,
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.circular(30),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.primary.withOpacity(0.3),
                        blurRadius: 20,
                        spreadRadius: 5,
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.group,
                    size: 60,
                    color: Colors.white,
                  ),
                ),
                
                const SizedBox(height: 32),
                
                // App Name
                Text(
                  'Topluluk',
                  style: TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.bold,
                    color: AppColors.primary,
                    letterSpacing: 1.2,
                  ),
                ),
                
                const SizedBox(height: 8),
                
                Text(
                  'Birlikte daha güçlüyüz',
                  style: TextStyle(
                    fontSize: 16,
                    color: AppColors.textSecondary,
                    letterSpacing: 0.5,
                  ),
                ),
                
                const SizedBox(height: 60),
                
                // Loading Indicator
                SizedBox(
                  width: 24,
                  height: 24,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation<Color>(AppColors.primary),
                  ),
                ),
                
                const SizedBox(height: 16),
                
                Text(
                  'Yükleniyor...',
                  style: TextStyle(
                    fontSize: 14,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
} 