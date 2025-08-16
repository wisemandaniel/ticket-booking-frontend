import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Animated } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

const baseUrl = 'http://192.168.1.45:3000';

export default function AuthScreen() {
  const { t, language, toggleLanguage } = useLanguage();
  const { 
    isAuthenticated, 
    setIsAuthenticated,
    signIn, 
    register,
    isLoading: authLoading 
  } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [errors, setErrors] = useState({ email: '', password: '', name: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const fadeAnim = useState(new Animated.Value(0))[0];

  // Show success snackbar
  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setShowSuccess(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      hideSuccessMessage();
    }, 3000);
  };

  // Hide success snackbar
  const hideSuccessMessage = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowSuccess(false);
    });
  };

  // Show error snackbar
  const showErrorMessage = (message: string) => {
    setErrorMessage(message);
    setShowError(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      hideErrorMessage();
    }, 3000);
  };

  // Hide error snackbar
  const hideErrorMessage = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowError(false);
    });
  };

  const validateForm = () => {
    const newErrors = { email: '', password: '', name: '' };
    let isValid = true;

    if (!email.includes('@')) {
      newErrors.email = t('emailError');
      isValid = false;
    }

    if (password.length < 6) {
      newErrors.password = t('passwordError');
      isValid = false;
    }

    if (!isLogin && !name.trim()) {
      newErrors.name = t('nameError');
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleAuth = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    setShowError(false); // Clear previous error

    try {
      if (isLogin) {
        await signIn({
          email: email.trim(),
          password: password.trim()
        });
      } else {
        await register({
          fullName: name.trim(),
          email: email.trim(),
          password: password.trim()
        });
        
        // Show success message
        showSuccessMessage(t('accountCreated'));
        
        // Switch to login screen and auto-fill after a delay
        setTimeout(() => {
          setIsLogin(true);
          setName(''); // Clear name field
        }, 500);
      }
    } catch (error: any) {
      // Extract the error message properly
      const message = error.response?.data?.message || 
                     error.message || 
                     error.toString() || 
                     t('authFailed');
      showErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Language selector in top right corner */}
      <TouchableOpacity 
        style={styles.languageButton} 
        onPress={toggleLanguage}
        accessibilityLabel={t('changeLanguage')}
      >
        <Text style={styles.languageText}>
          {language === 'en' ? 'FR' : 'EN'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.title}>{isLogin ? t('login') : t('signUp')}</Text>
      
      {!isLogin && (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder={t('fullName')}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            accessibilityLabel={t('nameInputLabel')}
            accessibilityHint={t('nameInputHint')}
          />
          {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
        </View>
      )}
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder={t('email')}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          accessibilityLabel={t('emailInputLabel')}
          accessibilityHint={t('emailInputHint')}
        />
        {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
      </View>
      
      <View style={styles.inputContainer}>
        <View style={styles.passwordContainer}>
          <TextInput
            style={[styles.input, styles.passwordInput]}
            placeholder={t('password')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            accessibilityLabel={t('passwordInputLabel')}
            accessibilityHint={t('passwordInputHint')}
          />
          <TouchableOpacity 
            style={styles.eyeIcon} 
            onPress={() => setShowPassword(!showPassword)}
            accessibilityLabel={showPassword ? t('hidePassword') : t('showPassword')}
          >
            <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#777" />
          </TouchableOpacity>
        </View>
        {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
      </View>
      
      <TouchableOpacity 
        style={[styles.button, (isLoading || authLoading) && styles.buttonDisabled]} 
        onPress={handleAuth}
        disabled={isLoading || authLoading}
      >
        {(isLoading || authLoading) ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>{isLogin ? t('login') : t('signUp')}</Text>
        )}
      </TouchableOpacity>
      
      {isLogin && (
        <TouchableOpacity style={styles.forgotPassword}>
          <Text style={styles.forgotPasswordText}>{t('forgotPassword')}</Text>
        </TouchableOpacity>
      )}
      
      <View style={styles.socialContainer}>
        <Text style={styles.socialText}>{t('orContinueWith')}</Text>
        <View style={styles.socialButtons}>
          <TouchableOpacity style={styles.socialButton}>
            <Ionicons name="logo-google" size={24} color="#DB4437" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton}>
            <Ionicons name="logo-apple" size={24} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton}>
            <Ionicons name="logo-facebook" size={24} color="#4267B2" />
          </TouchableOpacity>
        </View>
      </View>
      
      <TouchableOpacity 
        onPress={() => {
          setIsLogin(!isLogin);
          if (isLogin) {
            setName(''); // Clear name when switching to signup
          }
        }} 
        style={styles.switchContainer}
      >
        <Text style={styles.switchText}>
          {isLogin ? t('needAccount') : t('haveAccount')}
        </Text>
      </TouchableOpacity>

      {/* Error Snackbar */}
      {showError && (
        <Animated.View style={[styles.snackbar, styles.errorSnackbar, { opacity: fadeAnim }]}>
          <Ionicons name="warning" size={24} color="white" />
          <Text style={styles.snackbarText}>{errorMessage}</Text>
          <TouchableOpacity onPress={hideErrorMessage}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Success Snackbar */}
      {showSuccess && (
        <Animated.View style={[styles.snackbar, styles.successSnackbar, { opacity: fadeAnim }]}>
          <Ionicons name="checkmark-circle" size={24} color="white" />
          <Text style={styles.snackbarText}>{successMessage}</Text>
          <TouchableOpacity onPress={hideSuccessMessage}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
        </Animated.View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  languageButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageText: {
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#4CAF50',
  },
  inputContainer: {
    marginBottom: 15,
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  passwordContainer: {
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    paddingRight: 45,
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    padding: 10,
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    marginTop: 5,
    fontSize: 14,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 10,
  },
  forgotPasswordText: {
    color: '#4CAF50',
    fontSize: 14,
  },
  socialContainer: {
    marginVertical: 30,
  },
  socialText: {
    textAlign: 'center',
    color: '#777',
    marginBottom: 15,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchContainer: {
    marginTop: 20,
  },
  switchText: {
    color: '#4CAF50',
    textAlign: 'center',
    fontSize: 16,
  },
  snackbar: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  successSnackbar: {
    backgroundColor: '#4CAF50',
  },
  errorSnackbar: {
    backgroundColor: '#F44336',
  },
  snackbarText: {
    color: 'white',
    marginLeft: 10,
    marginRight: 10,
    flex: 1,
    fontSize: 16,
  },
});