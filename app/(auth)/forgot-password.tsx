import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Formik } from 'formik';
import * as yup from 'yup';
import { useAuth } from '../../contexts/AuthContext';
import { Snackbar } from '../../components/Snackbar';
import { router } from 'expo-router';

const COLORS = {
  primary: '#1E88E5',
  secondary: '#2D3748',
  background: '#FFFFFF',
  text: '#4A5568',
  border: '#E2E8F0'
};

const validationSchema = yup.object().shape({
  phone: yup.string()
    .matches(/^[0-9]{9}$/, 'Invalid phone number')
    .required('Required'),
  code: yup.string()
    .length(4, 'Must be 4 digits')
    .required('Required'),
  password: yup.string()
    .min(8, 'Minimum 8 characters')
    .matches(/[0-9]/, 'Requires a number')
    .matches(/[a-z]/, 'Requires a lowercase letter')
    .matches(/[A-Z]/, 'Requires an uppercase letter')
    .required('Required'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Required')
});

export default function ForgotPasswordScreen() {
  const { forgotPassword, verifyOtp, resetPassword, error, errorDetails, resetError } = useAuth();
  const [step, setStep] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [resendCountdown, setResendCountdown] = useState(30);
  const [resendEnabled, setResendEnabled] = useState(false);
  const [isResendCountdownActive, setIsResendCountdownActive] = useState(false);
  const [localSnackbar, setLocalSnackbar] = useState({
    visible: false,
    message: '',
    type: 'success' as 'error' | 'success',
    actions: [] as Array<{ text: string; onPress: () => void }>
  });

  useEffect(() => {
    if (isResendCountdownActive) {
      const timer = setInterval(() => {
        setResendCountdown((prev) => (prev <= 1 ? 30 : prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isResendCountdownActive]);

  useEffect(() => {
    if (resendCountdown === 30 && isResendCountdownActive) {
      setIsResendCountdownActive(false);
      setResendEnabled(true);
    }
  }, [resendCountdown]);

  const showSnackbar = (
    message: string, 
    type: 'error' | 'success' = 'success',
    actions: Array<{ text: string; onPress: () => void }> = []
  ) => {
    setLocalSnackbar({ visible: true, message, type, actions });
  };

  const handleSendCode = async (phone: string) => {
    try {
      const fullPhoneNumber = `237${phone}`;
      await forgotPassword(fullPhoneNumber);
      setPhoneNumber(phone);
      showSnackbar('Verification code sent successfully');
      setStep(2);
      setResendEnabled(false);
      setIsResendCountdownActive(true);
      setResendCountdown(30);
    } catch (err: any) {
      showSnackbar(
        err.response?.data?.message || 'Failed to send code',
        'error',
        err.response?.data?.actions?.map((a: any) => ({
          text: a.text,
          onPress: () => handleAuthAction(a.path)
        })) || []
      );
    }
  };

  const handleResendCode = async () => {
    if (!resendEnabled) return;
    
    try {
      const fullPhoneNumber = `237${phoneNumber}`;
      await forgotPassword(fullPhoneNumber);
      showSnackbar('Verification code resent successfully');
      setResendEnabled(false);
      setIsResendCountdownActive(true);
      setResendCountdown(30);
    } catch (err: any) {
      showSnackbar(
        err.response?.data?.message || 'Failed to resend code',
        'error'
      );
    }
  };

  const handleVerifyCode = async (phone: string, code: string) => {
    try {
      const fullPhoneNumber = `237${phone}`;
      const verificationSuccessful = await verifyOtp(fullPhoneNumber, code);
      
      if (verificationSuccessful) {
        setStep(3);
      } else {
        showSnackbar('Invalid verification code', 'error');
      }
    } catch (err: any) {
      showSnackbar(
        err.response?.data?.message || 'Invalid verification code',
        'error'
      );
    }
  };

  const handleResetPassword = async (values: { password: string }) => {
    try {
      const fullPhoneNumber = `237${phoneNumber}`;
      await resetPassword(fullPhoneNumber, values.password);
      showSnackbar('Password reset successfully!');
      router.replace('/(auth)/login');
    } catch (err: any) {
      showSnackbar(
        err.response?.data?.message || 'Failed to reset password',
        'error'
      );
    }
  };

  const handleAuthAction = (path: string) => {
    switch (path) {
      case '/login': return router.replace('/(auth)/login');
      case '/register': return router.push('/(auth)/signup');
      default: return;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          {[1, 2, 3].map((num) => (
            <View
              key={num}
              style={[
                styles.progressStep,
                step >= num && styles.activeStep,
                num === 1 && styles.firstStep,
                num === 3 && styles.lastStep,
              ]}
            />
          ))}
        </View>

        {/* Step 1: Phone Input */}
        {step === 1 && (
          <Formik
            initialValues={{ phone: '' }}
            validationSchema={yup.object().shape({
              phone: validationSchema.fields.phone
            })}
            onSubmit={(values) => handleSendCode(values.phone)}
          >
            {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
              <View>
                <Text style={styles.title}>Reset Password</Text>
                <Text style={styles.subtitle}>Enter your registered phone number</Text>

                <View style={styles.inputContainer}>
                  <MaterialCommunityIcons name="cellphone" size={20} color={COLORS.text} />
                  <TextInput
                    style={styles.input}
                    placeholder="Phone number"
                    placeholderTextColor={COLORS.text}
                    keyboardType="phone-pad"
                    value={values.phone}
                    onChangeText={handleChange('phone')}
                    onBlur={handleBlur('phone')}
                    maxLength={9}
                  />
                </View>
                {touched.phone && errors.phone && (
                  <Text style={styles.errorText}>{errors.phone}</Text>
                )}

                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleSubmit}
                >
                  <Text style={styles.buttonText}>Send Verification Code</Text>
                </TouchableOpacity>
              </View>
            )}
          </Formik>
        )}

        {/* Step 2: Code Verification */}
        {step === 2 && (
          <View>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setStep(1)}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Formik
              initialValues={{ code: '' }}
              validationSchema={yup.object().shape({
                code: validationSchema.fields.code
              })}
              onSubmit={(values) => handleVerifyCode(phoneNumber, values.code)}
            >
              {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
                <View>
                  <Text style={styles.title}>Verify Code</Text>
                  <Text style={styles.subtitle}>Enter the 4-digit code sent to your phone</Text>

                  <View style={styles.inputContainer}>
                    <MaterialCommunityIcons name="numeric" size={20} color={COLORS.text} />
                    <TextInput
                      style={styles.input}
                      placeholder="Verification code"
                      placeholderTextColor={COLORS.text}
                      keyboardType="number-pad"
                      value={values.code}
                      onChangeText={handleChange('code')}
                      onBlur={handleBlur('code')}
                      maxLength={4}
                    />
                  </View>
                  {touched.code && errors.code && (
                    <Text style={styles.errorText}>{errors.code}</Text>
                  )}

                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={handleSubmit}
                  >
                    <Text style={styles.buttonText}>Verify Code</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.secondaryButton, !resendEnabled && styles.disabledButton]}
                    onPress={handleResendCode}
                    disabled={!resendEnabled}
                  >
                    <Text style={styles.secondaryButtonText}>
                      Resend Code {!resendEnabled && `(${resendCountdown})`}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </Formik>
          </View>
        )}

        {/* Step 3: Password Reset */}
        {step === 3 && (
          <View>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setStep(2)}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Formik
                initialValues={{ password: '', confirmPassword: '' }}
                validationSchema={yup.object().shape({
                  password: validationSchema.fields.password,
                  confirmPassword: validationSchema.fields.confirmPassword
                })}
                onSubmit={handleResetPassword}
              >
                {({ handleChange, handleBlur, handleSubmit, values, errors, touched, isSubmitting }) => (
                  <View>
                    {/* Password Input */}
                    <View style={styles.inputContainer}>
                      <MaterialCommunityIcons name="lock-outline" size={20} color={COLORS.text} />
                      <TextInput
                        style={styles.input}
                        placeholder="New password"
                        placeholderTextColor={COLORS.text}
                        secureTextEntry
                        value={values.password}
                        onChangeText={handleChange('password')}
                        onBlur={handleBlur('password')}
                      />
                    </View>
                    {touched.password && errors.password && (
                      <Text style={styles.errorText}>{errors.password}</Text>
                    )}

                    {/* Confirm Password Input */}
                    <View style={styles.inputContainer}>
                      <MaterialCommunityIcons name="lock-check-outline" size={20} color={COLORS.text} />
                      <TextInput
                        style={styles.input}
                        placeholder="Confirm password"
                        placeholderTextColor={COLORS.text}
                        secureTextEntry
                        value={values.confirmPassword}
                        onChangeText={handleChange('confirmPassword')}
                        onBlur={handleBlur('confirmPassword')}
                      />
                    </View>
                    {touched.confirmPassword && errors.confirmPassword && (
                      <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                    )}

                    {/* Submit Button */}
                    <TouchableOpacity
                      style={[styles.primaryButton, isSubmitting && styles.disabledButton]}
                      onPress={handleSubmit}
                      disabled={isSubmitting}
                    >
                      <Text style={styles.buttonText}>
                        {isSubmitting ? 'Resetting Password...' : 'Reset Password'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </Formik>
          </View>
        )}

        {/* Global Error Snackbar */}
        <Snackbar
          visible={!!error}
          message={error || ''}
          type="error"
          actions={errorDetails?.actions || []}
          onDismiss={resetError}
        />

        {/* Local Snackbar */}
        <Snackbar
          visible={localSnackbar.visible}
          message={localSnackbar.message}
          type={localSnackbar.type}
          actions={localSnackbar.actions}
          onDismiss={() => setLocalSnackbar({...localSnackbar, visible: false})}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: 32,
    justifyContent: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 40,
  },
  progressStep: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    marginHorizontal: 2,
  },
  activeStep: {
    backgroundColor: COLORS.primary,
  },
  firstStep: {
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
  },
  lastStep: {
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: COLORS.secondary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginVertical: 8,
    height: 50,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    color: COLORS.secondary,
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  buttonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontWeight: '500',
  },
  errorText: {
    color: '#E53E3E',
    fontSize: 12,
    marginLeft: 8,
    marginBottom: 8,
  },
  backButton: {
    marginBottom: 20,
  },
  disabledButton: {
    opacity: 0.6,
  },
});