const { bucket, testBucketConnection } = require('./services/auth-service/config/firebase');

async function testFirebaseConnection() {
  try {
    console.log('🔥 Firebase Storage bağlantısı test ediliyor...');
    
    // Test bucket exists first
    const bucketExists = await testBucketConnection();
    
    if (!bucketExists) {
      console.log('\n📋 Firebase Storage ayarlama adımları:');
      console.log('1. https://console.firebase.google.com/project/topluluk-app-1303/storage adresine gidin');
      console.log('2. "Get started" butonuna tıklayın');
      console.log('3. Storage rules\'u production mode ile başlatın');
      console.log('4. Bu scripti tekrar çalıştırın');
      return;
    }
    
    // Test bucket connection if it exists
    const [metadata] = await bucket.getMetadata();
    console.log('✅ Firebase Storage bağlantısı başarılı!');
    console.log('📊 Bucket bilgileri:');
    console.log(`   - Name: ${metadata.name}`);
    console.log(`   - Location: ${metadata.location}`);
    console.log(`   - Storage Class: ${metadata.storageClass}`);
    console.log(`   - Created: ${metadata.timeCreated}`);
    
    // Test file listing (should be empty initially)
    const [files] = await bucket.getFiles({ maxResults: 5 });
    console.log(`📁 Bucket'ta ${files.length} dosya bulundu`);
    
    if (files.length > 0) {
      console.log('📋 İlk 5 dosya:');
      files.forEach((file, index) => {
        console.log(`   ${index + 1}. ${file.name}`);
      });
    }
    
    console.log('\n🎉 Firebase Storage test tamamlandı!');
    console.log('\n🚀 Upload endpointleri artık kullanıma hazır:');
    console.log('   • POST /api/v1/upload/community/{communityId}/event-photos');
    console.log('   • POST /api/v1/upload/community/{communityId}/banner-photo');
    console.log('   • POST /api/v1/upload/community/{communityId}/logo');
    console.log('   • POST /api/v1/upload/community/{communityId}/leader-document');
    
  } catch (error) {
    console.error('❌ Firebase Storage bağlantı hatası:', error.message);
    console.error('   Detaylar:', error);
    
    if (error.message.includes('firebase-admin-key.json')) {
      console.error('\n💡 Çözüm: firebase-admin-key.json dosyasını services/auth-service/config/ klasörüne koyun');
    }
  }
}

testFirebaseConnection(); 