import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'dart:async';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text.dart';
import '../../services/auth_service.dart';
import 'login_screen.dart';

class EmailVerificationScreen extends StatefulWidget {
  final String email;
  
  const EmailVerificationScreen({
    super.key,
    required this.email,
  });

  @override
  State<EmailVerificationScreen> createState() => _EmailVerificationScreenState();
}

class _EmailVerificationScreenState extends State<EmailVerificationScreen> {
  final List<TextEditingController> _controllers = List.generate(6, (index) => TextEditingController());
  final List<FocusNode> _focusNodes = List.generate(6, (index) => FocusNode());
  
  final AuthService _authService = AuthService();
  
  bool _isLoading = false;
  bool _isResending = false;
  int _countdown = 0;
  Timer? _countdownTimer;
  
  String get _verificationCode => _controllers.map((c) => c.text).join();

  @override
  void initState() {
    super.initState();
    _sendInitialEmail();
  }

  @override
  void dispose() {
    for (var controller in _controllers) {
      controller.dispose();
    }
    for (var focusNode in _focusNodes) {
      focusNode.dispose();
    }
    _countdownTimer?.cancel();
    super.dispose();
  }

  Future<void> _sendInitialEmail() async {
    // Sayfa açıldığında otomatik email gönder
    await _sendVerificationEmail();
  }

  Future<void> _sendVerificationEmail() async {
    setState(() => _isResending = true);
    
    try {
      final result = await _authService.sendVerificationEmail(widget.email);
      
      if (result.success) {
        _startCountdown(300); // 5 dakika
        
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(result.message),
              backgroundColor: AppColors.success,
              duration: const Duration(seconds: 3),
            ),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(result.message),
              backgroundColor: AppColors.error,
              duration: const Duration(seconds: 4),
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Beklenmeyen hata: $e'),
            backgroundColor: AppColors.error,
            duration: const Duration(seconds: 4),
          ),
        );
      }
    } finally {
      setState(() => _isResending = false);
    }
  }

  void _startCountdown(int seconds) {
    setState(() => _countdown = seconds);
    
    _countdownTimer?.cancel();
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      setState(() => _countdown--);
      
      if (_countdown <= 0) {
        timer.cancel();
      }
    });
  }

  String _formatCountdown([int? customSeconds]) {
    final secondsToFormat = customSeconds ?? _countdown;
    final minutes = secondsToFormat ~/ 60;
    final seconds = secondsToFormat % 60;
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }

  Future<void> _verifyCode() async {
    if (_verificationCode.length != 6) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Lütfen 6 haneli kodu eksiksiz girin'),
          backgroundColor: AppColors.warning,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);
    
    try {
      final result = await _authService.verifyEmail(
        email: widget.email,
        code: _verificationCode,
      );
      
      if (result.success) {
        // Başarı mesajı
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(result.message),
              backgroundColor: AppColors.success,
              duration: const Duration(seconds: 3),
            ),
          );
        }
        
        // 2 saniye bekleyip login'e yönlendir
        await Future.delayed(const Duration(seconds: 2));
        
        if (mounted) {
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(builder: (context) => const LoginScreen()),
          );
        }
        
      } else {
        // Hata durumları
        if (result.errorType == 'code_expired') {
          _showCodeExpiredDialog();
        } else if (result.errorType == 'invalid_code') {
          _clearCode();
          _showInvalidCodeError();
        } else {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(result.message),
                backgroundColor: AppColors.error,
                duration: const Duration(seconds: 4),
              ),
            );
          }
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Beklenmeyen hata: $e'),
            backgroundColor: AppColors.error,
            duration: const Duration(seconds: 4),
          ),
        );
      }
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _clearCode() {
    for (var controller in _controllers) {
      controller.clear();
    }
    _focusNodes[0].requestFocus();
  }

  void _showCodeExpiredDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            Icon(Icons.timer_off, color: AppColors.warning),
            const SizedBox(width: 10),
            const Text('Kod Süresi Doldu'),
          ],
        ),
        content: const Text(
          'Doğrulama kodunun süresi dolmuş. Yeni bir kod almak ister misiniz?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('İptal'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(context).pop();
              _sendVerificationEmail();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
            ),
            child: const Text('Yeni Kod Gönder'),
          ),
        ],
      ),
    );
  }

  void _showInvalidCodeError() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Doğrulama kodu hatalı, lütfen kontrol edin'),
        backgroundColor: AppColors.error,
        duration: Duration(seconds: 3),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Email Doğrulama'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            Navigator.of(context).pushReplacement(
              MaterialPageRoute(builder: (context) => const LoginScreen()),
            );
          },
        ),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const SizedBox(height: 40),
              
              // Header
              _buildHeader(),
              
              const SizedBox(height: 50),
              
              // Code Input
              _buildCodeInput(),
              
              const SizedBox(height: 30),
              
              // Verify Button
              _buildVerifyButton(),
              
              const SizedBox(height: 30),
              
              // Countdown & Resend
              _buildResendSection(),
              
              const SizedBox(height: 20),
              
              // Change Email
              _buildChangeEmailButton(),
              
              const Spacer(),
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
          width: 80,
          height: 80,
          decoration: BoxDecoration(
            color: AppColors.primary.withOpacity(0.1),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Icon(
            Icons.email_outlined,
            size: 40,
            color: AppColors.primary,
          ),
        ),
        
        const SizedBox(height: 20),
        
        const AppText.heading(
          text: 'Email Doğrulaması',
          fontSize: 24,
        ),
        
        const SizedBox(height: 12),
        
        Text(
          'Aşağıdaki e-posta adresine gönderilen\n6 haneli doğrulama kodunu girin',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 16,
            color: AppColors.textSecondary,
            height: 1.4,
          ),
        ),
        
        const SizedBox(height: 16),
        
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: AppColors.info.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: AppColors.info.withOpacity(0.3)),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.mail_outline, color: AppColors.info, size: 20),
              const SizedBox(width: 8),
              Text(
                widget.email,
                style: TextStyle(
                  color: AppColors.info,
                  fontWeight: FontWeight.w600,
                  fontSize: 16,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildCodeInput() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: List.generate(6, (index) {
        return SizedBox(
          width: 45,
          height: 55,
          child: TextField(
            controller: _controllers[index],
            focusNode: _focusNodes[index],
            textAlign: TextAlign.center,
            keyboardType: TextInputType.number,
            maxLength: 1,
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
            decoration: InputDecoration(
              counterText: '',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: BorderSide(color: AppColors.primary),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: BorderSide(color: AppColors.primary, width: 2),
              ),
            ),
            inputFormatters: [
              FilteringTextInputFormatter.digitsOnly,
            ],
            onChanged: (value) {
              if (value.isNotEmpty) {
                // Sonraki input'a geç
                if (index < 5) {
                  _focusNodes[index + 1].requestFocus();
                } else {
                  // Son karakterde otomatik verify
                  FocusScope.of(context).unfocus();
                  _verifyCode();
                }
              } else {
                // Önceki input'a geç
                if (index > 0) {
                  _focusNodes[index - 1].requestFocus();
                }
              }
            },
          ),
        );
      }),
    );
  }

  Widget _buildVerifyButton() {
    return SizedBox(
      width: double.infinity,
      height: 50,
      child: ElevatedButton(
        onPressed: _isLoading ? null : _verifyCode,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
        ),
        child: _isLoading
            ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  color: Colors.white,
                  strokeWidth: 2,
                ),
              )
            : const Text(
                'Doğrula',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
              ),
      ),
    );
  }

  Widget _buildResendSection() {
    final canResend = _countdown <= 240; // 4 dakika kaldığında (1 dakika geçince) aktif
    final remainingTimeForResend = _countdown > 240 ? _countdown - 240 : 0;
    
    return Column(
      children: [
        if (_countdown > 0) ...[
          Text(
            'Kodun geçerlilik süresi: ${_formatCountdown()}',
            style: TextStyle(
              color: AppColors.textSecondary,
              fontSize: 14,
            ),
          ),
        ] else ...[
          const Text(
            'Kodun süresi doldu. Yeni kod alın.',
            style: TextStyle(
              color: AppColors.error,
              fontSize: 14,
            ),
          ),
        ],
        
        const SizedBox(height: 12),
        
        TextButton(
          onPressed: (canResend && !_isResending) ? _sendVerificationEmail : () {
            // Aktif değilken tıklanırsa kalan süreyi göster
            if (!canResend && remainingTimeForResend > 0) {
              _showResendWarning(remainingTimeForResend);
            }
          },
          child: _isResending
              ? Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(
                        color: AppColors.primary,
                        strokeWidth: 2,
                      ),
                    ),
                    const SizedBox(width: 8),
                    const Text('Gönderiliyor...'),
                  ],
                )
              : Text(
                  'Yeniden Gönder',
                  style: TextStyle(
                    color: canResend ? AppColors.primary : Colors.grey,
                    fontWeight: FontWeight.w600,
                    fontSize: 16,
                  ),
                ),
        ),
      ],
    );
  }

  void _showResendWarning(int remainingSeconds) {
    final minutes = remainingSeconds ~/ 60;
    final seconds = remainingSeconds % 60;
    String timeText;
    
    if (minutes > 0) {
      timeText = '$minutes dakika ${seconds} saniye';
    } else {
      timeText = '$seconds saniye';
    }
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Yeni kod göndermek için $timeText daha beklemeniz gerekiyor'),
        backgroundColor: AppColors.warning,
        duration: const Duration(seconds: 3),
      ),
    );
  }

  Widget _buildChangeEmailButton() {
    return TextButton(
      onPressed: () {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (context) => const LoginScreen()),
        );
      },
      child: Text(
        'E-posta Adresini Değiştir',
        style: TextStyle(
          color: AppColors.textSecondary,
          fontSize: 14,
        ),
      ),
    );
  }
} 