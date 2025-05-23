import 'package:flutter/material.dart';
import '../../widgets/common/custom_text_field.dart';
import '../../core/utils/validators.dart';
import '../../services/auth_service.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _adController = TextEditingController();
  final _emailController = TextEditingController();
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
              color: Theme.of(context).primaryColor,
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Icon(
              Icons.group,
              color: Colors.white,
              size: 40,
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'Topluluk',
            style: TextStyle(
              fontSize: 32,
              fontWeight: FontWeight.bold,
              color: Colors.black87,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Hesabını oluştur ve topluluğa katıl',
            style: TextStyle(
              fontSize: 16,
              color: Colors.grey[600],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildForm() {
    return Form(
      key: _formKey,
      child: Column(
        children: [
          // Ad Soyad
          CustomTextField(
            controller: _adController,
            label: 'Ad Soyad',
            icon: Icons.person,
            validator: Validators.validateName,
          ),
          
          const SizedBox(height: 16),
          
          // Email
          CustomTextField(
            controller: _emailController,
            label: 'E-posta',
            icon: Icons.email,
            keyboardType: TextInputType.emailAddress,
            validator: Validators.validateEmail,
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
          ),
        ],
      ),
    );
  }

  Widget _buildRegisterButton() {
    return SizedBox(
      width: double.infinity,
      height: 56,
      child: ElevatedButton(
        onPressed: _isLoading ? null : _kayitOl,
        child: _isLoading 
          ? const CircularProgressIndicator(color: Colors.white)
          : const Text(
              'Kayıt Ol',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
              ),
            ),
      ),
    );
  }

  Widget _buildLoginLink() {
    return Center(
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            'Zaten hesabın var mı? ',
            style: TextStyle(
              color: Colors.grey[600],
              fontSize: 16,
            ),
          ),
          GestureDetector(
            onTap: _giriseSayfa,
            child: Text(
              'Giriş Yap',
              style: TextStyle(
                color: Theme.of(context).primaryColor,
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _kayitOl() async {
    if (_formKey.currentState!.validate()) {
      setState(() => _isLoading = true);
      
      try {
        final success = await _authService.register(
          name: _adController.text,
          email: _emailController.text,
          password: _sifreController.text,
        );
        
        if (success) {
          // Başarılı kayıt
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Kayıt işlemi başarılı!'),
              backgroundColor: Colors.green,
            ),
          );
          
          // TODO: Ana sayfaya yönlendir
        } else {
          // Başarısız kayıt
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Kayıt işlemi başarısız!'),
              backgroundColor: Colors.red,
            ),
          );
        }
      } catch (e) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Hata: $e'),
            backgroundColor: Colors.red,
          ),
        );
      } finally {
        setState(() => _isLoading = false);
      }
    }
  }

  void _giriseSayfa() {
    // Giriş sayfasına yönlendirme - şimdilik mesaj göster
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Giriş sayfası henüz hazır değil'),
      ),
    );
  }

  @override
  void dispose() {
    _adController.dispose();
    _emailController.dispose();
    _sifreController.dispose();
    _sifreTekrarController.dispose();
    super.dispose();
  }
}
