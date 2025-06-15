import 'package:flutter/material.dart';
import '../../widgets/common/custom_text_field.dart';
import '../../widgets/common/custom_button.dart';
import '../../core/utils/validators.dart';
import '../../services/auth_service.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text.dart';
import 'login_screen.dart';
import 'community_leader_registration_screen.dart';

class RegisterScreen extends StatefulWidget {
  final bool isFromLeaderRegistration;
  final VoidCallback? onRegistrationSuccess;
  final bool isLeaderRegistrationMode; // Topluluk başkanı kayıt modu
  final bool isLeaderOfCommunity; // Topluluk başkanı mı?
  
  const RegisterScreen({
    super.key,
    this.isFromLeaderRegistration = false,
    this.onRegistrationSuccess,
    this.isLeaderRegistrationMode = false,
    this.isLeaderOfCommunity = false,
  });

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
  
  // Yeni eklenen alanlar
  final _universiteController = TextEditingController();
  final _bolumController = TextEditingController();
  final _sinifController = TextEditingController();
  
  bool _sifreGizli = true;
  bool _sifreTekrarGizli = true;
  bool _isLoading = false;

  final _authService = AuthService();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: widget.isFromLeaderRegistration 
          ? AppBar(
              title: const Text('Normal Kullanıcı Kayıt'),
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
            )
          : null,
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
            isRequired: true,
          ),
          
          const SizedBox(height: 16),
          
          // Soyad
          CustomTextField(
            controller: _soyadController,
            label: 'Soyad',
            icon: Icons.person_outline,
            validator: Validators.validateSurname,
            isRequired: true,
          ),
          
          const SizedBox(height: 16),
          
          // Email
          CustomTextField(
            controller: _emailController,
            label: 'E-posta',
            icon: Icons.email,
            keyboardType: TextInputType.emailAddress,
            validator: Validators.validateEmail,
            isRequired: true,
          ),
          
          const SizedBox(height: 16),
          
          // Telefon
          CustomTextField(
            controller: _telefonController,
            label: 'Telefon (10 haneli, başında 0 olmadan)',
            icon: Icons.phone,
            keyboardType: TextInputType.phone,
            validator: Validators.validatePhone,
            isRequired: true,
          ),
          
          const SizedBox(height: 16),
          
          // Üniversite
          CustomTextField(
            controller: _universiteController,
            label: widget.isLeaderRegistrationMode ? 'Üniversite' : 'Üniversite (İsteğe Bağlı)',
            icon: Icons.school,
            validator: widget.isLeaderRegistrationMode 
                ? Validators.validateUniversityRequiredForRegistration
                : Validators.validateUniversityOptional,
            isRequired: widget.isLeaderRegistrationMode,
          ),
          
          const SizedBox(height: 16),
          
          // Bölüm
          CustomTextField(
            controller: _bolumController,
            label: widget.isLeaderRegistrationMode ? 'Bölüm' : 'Bölüm (İsteğe Bağlı)',
            icon: Icons.school_outlined,
            validator: widget.isLeaderRegistrationMode 
                ? Validators.validateDepartmentRequiredForRegistration
                : Validators.validateDepartmentOptional,
            isRequired: widget.isLeaderRegistrationMode,
          ),
          
          const SizedBox(height: 16),
          
          // Sınıf
          CustomTextField(
            controller: _sinifController,
            label: widget.isLeaderRegistrationMode ? 'Sınıf' : 'Sınıf (İsteğe Bağlı)',
            icon: Icons.class_,
            validator: widget.isLeaderRegistrationMode 
                ? Validators.validateGradeRequiredForRegistration
                : Validators.validateGradeOptional,
            isRequired: widget.isLeaderRegistrationMode,
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
            isRequired: true,
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
            isRequired: true,
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
      child: Column(
        children: [
          // Topluluk Başkanı/Normal Kullanıcı Toggle Butonu
          if (!widget.isFromLeaderRegistration) ...[
            Container(
              width: double.infinity,
              margin: const EdgeInsets.only(bottom: 20),
              child: OutlinedButton.icon(
                onPressed: _navigateToLeaderRegistration,
                icon: Icon(Icons.group_work, color: AppColors.primary),
                label: Text(
                  'Topluluk Başkanı mısın?',
                  style: TextStyle(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w600,
                    fontSize: 16,
                  ),
                ),
                style: OutlinedButton.styleFrom(
                  side: BorderSide(color: AppColors.primary, width: 2),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
              ),
            ),
          ] else ...[
            Container(
              width: double.infinity,
              margin: const EdgeInsets.only(bottom: 20),
              child: OutlinedButton.icon(
                onPressed: _navigateToNormalRegistration,
                icon: Icon(Icons.person, color: AppColors.primary),
                label: Text(
                  'Normal Kullanıcı mısın?',
                  style: TextStyle(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w600,
                    fontSize: 16,
                  ),
                ),
                style: OutlinedButton.styleFrom(
                  side: BorderSide(color: AppColors.primary, width: 2),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
              ),
            ),
          ],
          
          // Normal Login Link
          Row(
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
        ],
      ),
    );
  }

  Future<void> _kayitOl() async {
    if (_formKey.currentState!.validate()) {
      setState(() => _isLoading = true);
      
      try {
        print('📱 Form verileri gönderiliyor...');
        print('👤 Status: ${widget.isLeaderOfCommunity ? 'leader_of_community' : 'user'}');
        
        final result = await _authService.register(
          name: _adController.text.trim(),
          surname: _soyadController.text.trim(),
          email: _emailController.text.trim(),
          phone: _telefonController.text.trim(),
          password: _sifreController.text,
          university: widget.isLeaderRegistrationMode 
              ? _universiteController.text.trim() 
              : (_universiteController.text.trim().isNotEmpty ? _universiteController.text.trim() : null),
          department: widget.isLeaderRegistrationMode 
              ? _bolumController.text.trim() 
              : (_bolumController.text.trim().isNotEmpty ? _bolumController.text.trim() : null),
          grade: widget.isLeaderRegistrationMode 
              ? _sinifController.text.trim() 
              : (_sinifController.text.trim().isNotEmpty ? _sinifController.text.trim() : null),
          status: widget.isLeaderOfCommunity ? 'leader_of_community' : 'user',
        );
        
        if (result.success) {
          // Başarılı kayıt
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(result.message),
              backgroundColor: Colors.green,
              duration: const Duration(seconds: 2),
            ),
          );
          
          // Form alanlarını temizle
          _clearAllFields();
          
          print('✅ Kayıt başarılı: ${result.data}');
          
          // Başarılı kayıt sonrası aksiyon
          await Future.delayed(const Duration(milliseconds: 500));
          if (mounted) {
            if (widget.onRegistrationSuccess != null) {
              // Topluluk başkanı kayıt akışından geliyorsa callback çağır
              widget.onRegistrationSuccess!();
            } else {
              // Normal kayıt akışı - login sayfasına git
              Navigator.of(context).pushReplacement(
                MaterialPageRoute(builder: (context) => const LoginScreen()),
              );
            }
          }
          
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
    _universiteController.clear();
    _bolumController.clear();
    _sinifController.clear();
    
    // Form validation durumunu da sıfırla
    _formKey.currentState?.reset();
    
    print('🧹 Form alanları temizlendi');
  }

  void _giriseSayfa() {
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (context) => const LoginScreen()),
    );
  }

  void _navigateToLeaderRegistration() {
    // Normal kayıt sayfasından topluluk başkanı kayıt akışına git
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => const CommunityLeaderRegistrationScreen(),
      ),
    );
  }

  void _navigateToNormalRegistration() {
    // Topluluk başkanı kayıt akışından normal kayıt sayfasına git
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (context) => const RegisterScreen(),
      ),
    );
  }

  @override
  void dispose() {
    _adController.dispose();
    _soyadController.dispose();
    _emailController.dispose();
    _telefonController.dispose();
    _sifreController.dispose();
    _sifreTekrarController.dispose();
    _universiteController.dispose();
    _bolumController.dispose();
    _sinifController.dispose();
    super.dispose();
  }
}
