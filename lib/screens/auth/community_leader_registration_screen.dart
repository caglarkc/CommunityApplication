import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text.dart';
import 'register_screen.dart';
import 'community_info_screen.dart';

class CommunityLeaderRegistrationScreen extends StatelessWidget {
  const CommunityLeaderRegistrationScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Topluluk Başkanı Kayıt'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const SizedBox(height: 40),
              
              // Logo ve başlık
              _buildHeader(),
              
              const SizedBox(height: 40),
              
              // Açıklama
              _buildDescription(),
              
              const SizedBox(height: 40),
              
              // Kayıt akışı
              _buildRegistrationFlow(context),
              
              const Spacer(),
              
              // Başla butonu
              _buildStartButton(context),
              
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Column(
      children: [
        Container(
          width: 100,
          height: 100,
          decoration: BoxDecoration(
            color: AppColors.primary,
            borderRadius: BorderRadius.circular(25),
          ),
          child: const Icon(
            Icons.group_work,
            color: Colors.white,
            size: 50,
          ),
        ),
        const SizedBox(height: 16),
        const AppText.heading(
          text: 'Topluluk Başkanı Kayıt',
          fontSize: 28,
        ),
        const SizedBox(height: 8),
        Text(
          'Topluluğunuzu platformda temsil edin',
          textAlign: TextAlign.center,
          style: TextStyle(
            color: AppColors.textSecondary,
            fontSize: 16,
          ),
        ),
      ],
    );
  }

  Widget _buildDescription() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.primary.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          const Icon(
            Icons.info_outline,
            color: AppColors.primary,
            size: 32,
          ),
          const SizedBox(height: 12),
          Text(
            'Topluluk başkanı olarak kayıt olmak için önce kişisel bilgilerinizi doldurun, ardından topluluğunuzun bilgilerini ekleyin.',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: AppColors.textPrimary,
              fontSize: 16,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRegistrationFlow(BuildContext context) {
    return Column(
      children: [
        const AppText.heading(
          text: 'Kayıt Süreci',
          fontSize: 20,
        ),
        const SizedBox(height: 24),
        
        // Adım 1
        _buildStep(
          number: '1',
          title: 'Kişisel Bilgiler',
          description: 'Ad, soyad, email, telefon ve üniversite bilgileri',
          icon: Icons.person,
        ),
        
        const SizedBox(height: 16),
        
        // Bağlantı çizgisi
        Container(
          width: 2,
          height: 20,
          color: AppColors.primary.withOpacity(0.3),
        ),
        
        const SizedBox(height: 16),
        
        // Adım 2
        _buildStep(
          number: '2',
          title: 'Topluluk Bilgileri',
          description: 'Topluluk adı, açıklama, aktiviteler ve iletişim',
          icon: Icons.group,
        ),
      ],
    );
  }

  Widget _buildStep({
    required String number,
    required String title,
    required String description,
    required IconData icon,
  }) {
    return Row(
      children: [
        // Numara
        Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: AppColors.primary,
            borderRadius: BorderRadius.circular(20),
          ),
          child: Center(
            child: Text(
              number,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 18,
              ),
            ),
          ),
        ),
        
        const SizedBox(width: 16),
        
        // İkon
        Container(
          width: 50,
          height: 50,
          decoration: BoxDecoration(
            color: AppColors.primary.withOpacity(0.1),
            borderRadius: BorderRadius.circular(25),
          ),
          child: Icon(
            icon,
            color: AppColors.primary,
            size: 24,
          ),
        ),
        
        const SizedBox(width: 16),
        
        // Açıklama
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontWeight: FontWeight.w600,
                  fontSize: 16,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                description,
                style: TextStyle(
                  color: AppColors.textSecondary,
                  fontSize: 14,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildStartButton(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 56,
      child: ElevatedButton(
        onPressed: () => _startRegistration(context),
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        child: const Text(
          'Kayıt Sürecini Başlat',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }

  void _startRegistration(BuildContext context) {
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (context) => const LeaderRegistrationFlow(),
      ),
    );
  }
}

// Topluluk başkanı kayıt akış sayfası
class LeaderRegistrationFlow extends StatefulWidget {
  const LeaderRegistrationFlow({super.key});

  @override
  State<LeaderRegistrationFlow> createState() => _LeaderRegistrationFlowState();
}

class _LeaderRegistrationFlowState extends State<LeaderRegistrationFlow> {
  bool _personalInfoCompleted = false;

  @override
  Widget build(BuildContext context) {
    if (!_personalInfoCompleted) {
      // İlk adım: Kişisel bilgiler (normal kayıt sayfası)
      return _LeaderRegisterScreen(
        onRegistrationComplete: () {
          setState(() {
            _personalInfoCompleted = true;
          });
        },
      );
    } else {
      // İkinci adım: Topluluk bilgileri
      return const CommunityInfoScreen();
    }
  }
}

// Özel topluluk başkanı kayıt sayfası - normal kayıt sayfasının wrapped hali
class _LeaderRegisterScreen extends StatelessWidget {
  final VoidCallback onRegistrationComplete;

  const _LeaderRegisterScreen({
    required this.onRegistrationComplete,
  });

  @override
  Widget build(BuildContext context) {
    return RegisterScreen(
      isFromLeaderRegistration: true,
      onRegistrationSuccess: onRegistrationComplete,
      isLeaderRegistrationMode: true, // Topluluk başkanı modu aktif
      isLeaderOfCommunity: true, // Status: leader_of_community
    );
  }
} 