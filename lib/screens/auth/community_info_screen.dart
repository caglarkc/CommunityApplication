import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text.dart';
import '../../widgets/common/custom_text_field.dart';
import '../../widgets/common/custom_button.dart';
import '../../core/utils/validators.dart';
import '../home/home_screen.dart';

class CommunityInfoScreen extends StatefulWidget {
  const CommunityInfoScreen({super.key});

  @override
  State<CommunityInfoScreen> createState() => _CommunityInfoScreenState();
}

class _CommunityInfoScreenState extends State<CommunityInfoScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;
  
  // Topluluk bilgileri
  final _communityNameController = TextEditingController();
  final _communityDescController = TextEditingController();
  final _universityController = TextEditingController();
  final _departmentController = TextEditingController();
  
  @override
  void dispose() {
    _communityNameController.dispose();
    _communityDescController.dispose();
    _universityController.dispose();
    _departmentController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Topluluk Bilgileri'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        automaticallyImplyLeading: false, // Geri butonu kaldır
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Başlık ve açıklama
              _buildHeader(),
              
              const SizedBox(height: 30),
              
              // Form
              _buildForm(),
              
              const SizedBox(height: 32),
              
              // Kaydet butonu
              _buildSaveButton(),
              
              const SizedBox(height: 24),
              
              // Daha sonra tamamla butonu
              _buildSkipButton(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Center(
          child: Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: AppColors.primary,
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Icon(
              Icons.group_work,
              color: Colors.white,
              size: 40,
            ),
          ),
        ),
        const SizedBox(height: 16),
        const Center(
          child: AppText.heading(
            text: 'Topluluk Bilgilerini Tamamlayın',
            fontSize: 24,
          ),
        ),
        const SizedBox(height: 8),
        Center(
          child: Text(
            'Topluluğunuzun tanıtımı için gerekli bilgileri doldurun',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: AppColors.textSecondary,
              fontSize: 16,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildForm() {
    return Form(
      key: _formKey,
      child: Column(
        children: [
          // Topluluk adı
          CustomTextField(
            controller: _communityNameController,
            label: 'Topluluk Adı',
            icon: Icons.group,
            validator: Validators.validateCommunityName,
            isRequired: true,
          ),
          
          const SizedBox(height: 16),
          
          // Topluluk açıklaması
          CustomTextField(
            controller: _communityDescController,
            label: 'Topluluk Açıklaması',
            icon: Icons.description,
            maxLines: 4,
            validator: Validators.validateCommunityDescription,
            isRequired: true,
          ),
          
          const SizedBox(height: 16),
          
          // Üniversite
          CustomTextField(
            controller: _universityController,
            label: 'Üniversite',
            icon: Icons.school,
            validator: Validators.validateUniversityRequired,
            isRequired: true,
          ),
          
          const SizedBox(height: 16),
          
          // Üniversite Departmanı
          CustomTextField(
            controller: _departmentController,
            label: 'Üniversite Departmanı',
            icon: Icons.school_outlined,
            validator: Validators.validateCommunityDepartment,
            isRequired: true,
          ),
        ],
      ),
    );
  }

  Widget _buildSaveButton() {
    return CustomButton(
      text: 'Topluluk Bilgilerini Kaydet',
      onPressed: _isLoading ? null : _saveCommunityInfo,
      isLoading: _isLoading,
      height: 56,
    );
  }

  Widget _buildSkipButton() {
    return Center(
      child: TextButton(
        onPressed: _skipForNow,
        child: Text(
          'Daha sonra tamamlayacağım',
          style: TextStyle(
            color: AppColors.textSecondary,
            fontSize: 16,
            decoration: TextDecoration.underline,
          ),
        ),
      ),
    );
  }

  Future<void> _saveCommunityInfo() async {
    if (_formKey.currentState!.validate()) {
      setState(() => _isLoading = true);
      
      try {
        // TODO: Backend'e topluluk bilgilerini gönder
        final communityData = {
          'name': _communityNameController.text.trim(),
          'description': _communityDescController.text.trim(),
          'universityName': _universityController.text.trim(),
          'universityDepartment': _departmentController.text.trim(),
        };
        
        print('🏛️ Topluluk bilgileri kaydediliyor: $communityData');
        
        // Simüle edilmiş başarı
        await Future.delayed(const Duration(seconds: 2));
        
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Topluluk bilgileri başarıyla kaydedildi!'),
              backgroundColor: Colors.green,
            ),
          );
          
          _navigateToHome();
        }
        
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Hata: $e'),
              backgroundColor: Colors.red,
            ),
          );
        }
      } finally {
        setState(() => _isLoading = false);
      }
    }
  }

  void _skipForNow() {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Daha Sonra Tamamla'),
          content: const Text('Topluluk bilgilerini daha sonra profil ayarlarından tamamlayabilirsiniz.'),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('İptal'),
            ),
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
                _navigateToHome();
              },
              child: const Text('Devam Et'),
            ),
          ],
        );
      },
    );
  }

  void _navigateToHome() {
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (context) => const HomeScreen()),
      (route) => false, // Tüm önceki sayfaları temizle
    );
  }
} 