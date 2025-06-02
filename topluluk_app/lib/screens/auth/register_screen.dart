import 'package:flutter/material.dart';
import '../../widgets/common/custom_text_field.dart';
import '../../widgets/common/custom_button.dart';
import '../../core/utils/validators.dart';
import '../../services/auth_service.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text.dart';
import 'login_screen.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _adController = TextEditingController();
  final _soyadController = TextEditingController();
  final _emailController = TextEditingController();
  final _telefonController = TextEditingController();
  final _sifreController = TextEditingController();
  final _sifreTekrarController = TextEditingController();
  
  bool _sifreGizli = true;
  bool _sifreTekrarGizli = true;
  bool _isLoading = false;

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
              const SizedBox(height: 40),
              
              // Logo ve Başlık
              _buildHeader(),
              
              const SizedBox(height: 40),
              
              // Form
              _buildForm(),
              
              const SizedBox(height: 32),
              
              // Kayıt Ol Butonu
              _buildRegisterButton(),
              
              const SizedBox(height: 24),
              
              // Giriş Yap Linki
              _buildLoginLink(),
              
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
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: AppColors.buttonPrimaryColor,
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Icon(
              Icons.group,
              color: Colors.white,
              size: 40,
            ),
          ),
          const SizedBox(height: 16),
          const AppText.heading(text: 'Topluluk'),
          const SizedBox(height: 8),
          const AppText.subheading(text: 'Hesabını oluştur ve topluluğa katıl'),
        ],
      ),
    );
  }

  Widget _buildForm() {
    return Form(
      key: _formKey,
      child: Column(
        children: [
          // Ad
          CustomTextField(
            controller: _adController,
            label: 'Ad',
            icon: Icons.person,
            validator: Validators.validateName,
            onTap: () => _clearErrorsIfFieldInvalid(_adController.text, Validators.validateName),
          ),
          
          const SizedBox(height: 16),
          
          // Soyad
          CustomTextField(
            controller: _soyadController,
            label: 'Soyad',
            icon: Icons.person_outline,
            validator: Validators.validateSurname,
            onTap: () => _clearErrorsIfFieldInvalid(_soyadController.text, Validators.validateSurname),
          ),
          
          const SizedBox(height: 16),
          
          // Email
          CustomTextField(
            controller: _emailController,
            label: 'E-posta',
            icon: Icons.email,
            keyboardType: TextInputType.emailAddress,
            validator: Validators.validateEmail,
            onTap: () => _clearErrorsIfFieldInvalid(_emailController.text, Validators.validateEmail),
          ),
          
          const SizedBox(height: 16),
          
          // Telefon
          CustomTextField(
            controller: _telefonController,
            label: 'Telefon (5xxxxxxxxx)',
            icon: Icons.phone,
            keyboardType: TextInputType.phone,
            validator: Validators.validatePhone,
            onTap: () => _clearErrorsIfFieldInvalid(_telefonController.text, Validators.validatePhone),
          ),
          
          const SizedBox(height: 16),
          
          // Şifre
          CustomTextField(
            controller: _sifreController,
            label: 'Şifre',
            icon: Icons.lock,
            obscureText: _sifreGizli,
            suffixIcon: IconButton(
              icon: Icon(_sifreGizli ? Icons.visibility : Icons.visibility_off),
              onPressed: () => setState(() => _sifreGizli = !_sifreGizli),
            ),
            validator: Validators.validatePassword,
            onTap: () => _clearErrorsIfFieldInvalid(_sifreController.text, Validators.validatePassword),
          ),
          
          const SizedBox(height: 16),
          
          // Şifre Tekrar
          CustomTextField(
            controller: _sifreTekrarController,
            label: 'Şifre Tekrar',
            icon: Icons.lock_outline,
            obscureText: _sifreTekrarGizli,
            suffixIcon: IconButton(
              icon: Icon(_sifreTekrarGizli ? Icons.visibility : Icons.visibility_off),
              onPressed: () => setState(() => _sifreTekrarGizli = !_sifreTekrarGizli),
            ),
            validator: (value) => Validators.validatePasswordMatch(value, _sifreController.text),
            onTap: () => _clearErrorsIfFieldInvalid(_sifreTekrarController.text, 
              (value) => Validators.validatePasswordMatch(value, _sifreController.text)),
          ),
        ],
      ),
    );
  }

  Widget _buildRegisterButton() {
    return CustomButton(
      text: 'Kayıt Ol',
      onPressed: _isLoading ? null : _kayitOl,
      isLoading: _isLoading,
      height: 56,
    );
  }

  Widget _buildLoginLink() {
    return Center(
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const AppText.body(
            text: 'Zaten hesabın var mı? ',
            fontSize: 16,
          ),
          GestureDetector(
            onTap: _giriseSayfa,
            child: const AppText.link(text: 'Giriş Yap'),
          ),
        ],
      ),
    );
  }

  Future<void> _kayitOl() async {
    if (_formKey.currentState!.validate()) {
      setState(() => _isLoading = true);
      
      try {
        print('📱 Form verileri gönderiliyor...');
        
        final result = await _authService.register(
          name: _adController.text.trim(),
          surname: _soyadController.text.trim(),
          email: _emailController.text.trim(),
          phone: _telefonController.text.trim(),
          password: _sifreController.text,
        );
        
        if (result.success) {
          // Başarılı kayıt
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(result.message),
              backgroundColor: Colors.green,
              duration: const Duration(seconds: 3),
            ),
          );
          
          // Form alanlarını temizle
          _clearAllFields();
          
          // TODO: Ana sayfaya yönlendir veya login sayfasına git
          print('✅ Kayıt başarılı: ${result.data}');
          
        } else {
          // Başarısız kayıt
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

  // Tüm form alanlarını temizle
  void _clearAllFields() {
    _adController.clear();
    _soyadController.clear();
    _emailController.clear();
    _telefonController.clear();
    _sifreController.clear();
    _sifreTekrarController.clear();
    
    // Form validation durumunu da sıfırla
    _formKey.currentState?.reset();
    
    print('🧹 Form alanları temizlendi');
  }

  void _giriseSayfa() {
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (context) => const LoginScreen()),
    );
  }

  // Sadece tıklanan field hatalıysa tüm hataları temizle
  void _clearErrorsIfFieldInvalid(String value, String? Function(String?) validator) {
    if (_formKey.currentState != null) {
      // Tıklanan field'ın validator'ını çalıştır
      String? fieldError = validator(value);
      
      // Eğer tıklanan field hatalıysa tüm hataları temizle
      if (fieldError != null) {
        setState(() {
          _formKey.currentState!.reset();
        });
      }
    }
  }

  @override
  void dispose() {
    _adController.dispose();
    _soyadController.dispose();
    _emailController.dispose();
    _telefonController.dispose();
    _sifreController.dispose();
    _sifreTekrarController.dispose();
    super.dispose();
  }
}
