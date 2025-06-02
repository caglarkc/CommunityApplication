import 'package:flutter/material.dart';
import '../../widgets/common/custom_text_field.dart';
import '../../widgets/common/custom_button.dart';
import '../../core/utils/validators.dart';
import '../../services/auth_service.dart';
import '../../services/device_service.dart';
import '../../services/token_service.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text.dart';
import 'register_screen.dart';
import '../home/home_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailPhoneController = TextEditingController();
  final _sifreController = TextEditingController();
  
  bool _sifreGizli = true;
  bool _isLoading = false;
  bool _isEmailMode = true; // true = email, false = phone
  
  final _authService = AuthService();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 60),
              
              // Logo ve Başlık
              _buildHeader(),
              
              const SizedBox(height: 50),
              
              // Email/Phone Switch
              _buildSwitchSection(),
              
              const SizedBox(height: 30),
              
              // Form
              _buildForm(),
              
              const SizedBox(height: 40),
              
              // Giriş Yap Butonu
              _buildLoginButton(),
              
              const SizedBox(height: 30),
              
              // Kayıt Ol Linki
              _buildRegisterLink(),
              
              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Center(
      child: Column(
        children: [
          Container(
            width: 90,
            height: 90,
            decoration: BoxDecoration(
              color: AppColors.buttonPrimaryColor,
              borderRadius: BorderRadius.circular(25),
              boxShadow: [
                BoxShadow(
                  color: AppColors.buttonPrimaryColor.withOpacity(0.3),
                  blurRadius: 20,
                  offset: const Offset(0, 10),
                ),
              ],
            ),
            child: const Icon(
              Icons.group_rounded,
              color: Colors.white,
              size: 45,
            ),
          ),
          const SizedBox(height: 20),
          const AppText.heading(
            text: 'Hoş Geldin!',
            fontSize: 28,
          ),
          const SizedBox(height: 8),
          const AppText.subheading(
            text: 'Hesabına giriş yap ve topluluğa katıl',
            fontSize: 16,
          ),
        ],
      ),
    );
  }

  Widget _buildSwitchSection() {
    return Center(
      child: Container(
        decoration: BoxDecoration(
          color: Colors.grey[100],
          borderRadius: BorderRadius.circular(25),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            _buildSwitchButton(
              text: 'E-posta',
              icon: Icons.email_outlined,
              isSelected: _isEmailMode,
              onTap: () => setState(() {
                _isEmailMode = true;
                _emailPhoneController.clear();
              }),
            ),
            _buildSwitchButton(
              text: 'Telefon',
              icon: Icons.phone_outlined,
              isSelected: !_isEmailMode,
              onTap: () => setState(() {
                _isEmailMode = false;
                _emailPhoneController.clear();
              }),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSwitchButton({
    required String text,
    required IconData icon,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.buttonPrimaryColor : Colors.transparent,
          borderRadius: BorderRadius.circular(25),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              color: isSelected ? Colors.white : Colors.grey[600],
              size: 20,
            ),
            const SizedBox(width: 8),
            Text(
              text,
              style: TextStyle(
                color: isSelected ? Colors.white : Colors.grey[600],
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                fontSize: 16,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildForm() {
    return Form(
      key: _formKey,
      child: Column(
        children: [
          // Email/Phone Field
          CustomTextField(
            controller: _emailPhoneController,
            label: _isEmailMode ? 'E-posta Adresi' : 'Telefon Numarası',
            icon: _isEmailMode ? Icons.email : Icons.phone,
            keyboardType: _isEmailMode 
                ? TextInputType.emailAddress 
                : TextInputType.phone,
            validator: _isEmailMode 
                ? Validators.validateEmail 
                : Validators.validatePhone,
          ),
          
          const SizedBox(height: 20),
          
          // Şifre Field
          CustomTextField(
            controller: _sifreController,
            label: 'Şifre',
            icon: Icons.lock,
            obscureText: _sifreGizli,
            suffixIcon: IconButton(
              icon: Icon(_sifreGizli ? Icons.visibility : Icons.visibility_off),
              onPressed: () => setState(() => _sifreGizli = !_sifreGizli),
            ),
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Şifre alanı boş bırakılamaz';
              }
              return null;
            },
          ),
        ],
      ),
    );
  }

  Widget _buildLoginButton() {
    return CustomButton(
      text: 'Giriş Yap',
      onPressed: _isLoading ? null : _girisYap,
      isLoading: _isLoading,
      height: 56,
    );
  }

  Widget _buildRegisterLink() {
    return Center(
      child: Column(
        children: [
          // Şifremi Unuttum
          GestureDetector(
            onTap: _sifremiUnuttum,
            child: const AppText.link(
              text: 'Şifremi Unuttum',
              fontSize: 16,
            ),
          ),
          
          const SizedBox(height: 20),
          
          // Kayıt Ol Link
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const AppText.body(
                text: 'Hesabın yok mu? ',
                fontSize: 16,
              ),
              GestureDetector(
                onTap: _kayitSayfasi,
                child: const AppText.link(
                  text: 'Kayıt Ol',
                  fontSize: 16,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Future<void> _girisYap() async {
    if (_formKey.currentState!.validate()) {
      setState(() => _isLoading = true);
      
      try {
        print('📱 Giriş işlemi başlatılıyor...');
        
        // Device info al
        final deviceInfo = await DeviceService.getDeviceInfo();
        DeviceService.printDeviceInfo(deviceInfo);
        
        // Auth service'e giriş isteği
        final result = await _authService.login(
          emailOrPhone: _emailPhoneController.text.trim(),
          password: _sifreController.text,
          isEmail: _isEmailMode,
          deviceInfo: deviceInfo,
        );
        
        if (result.success) {
          // Access token'ı kaydet
          final accessToken = result.data['accessToken'] as String?;
          if (accessToken != null) {
            await TokenService.saveAccessToken(accessToken);
            
            // Device fingerprint'i kaydet
            final fingerprint = DeviceService.generateFingerprint(deviceInfo);
            await TokenService.saveDeviceFingerprint(fingerprint);
            
            print('✅ Giriş başarılı, token kaydedildi');
          }
          
          // Başarı mesajı
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(result.message),
              backgroundColor: Colors.green,
              duration: const Duration(seconds: 2),
            ),
          );
          
          // Ana sayfaya yönlendir
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(builder: (context) => const HomeScreen()),
          );
          
        } else {
          // Başarısız giriş
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(result.message),
              backgroundColor: Colors.red,
              duration: const Duration(seconds: 4),
            ),
          );
        }
      } catch (e) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Beklenmeyen hata: $e'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 4),
          ),
        );
      } finally {
        setState(() => _isLoading = false);
      }
    }
  }

  void _sifremiUnuttum() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Şifre sıfırlama özelliği henüz hazır değil'),
      ),
    );
  }

  void _kayitSayfasi() {
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (context) => const RegisterScreen()),
    );
  }

  @override
  void dispose() {
    _emailPhoneController.dispose();
    _sifreController.dispose();
    super.dispose();
  }
}
