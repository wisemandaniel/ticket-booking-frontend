import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator, ScrollView, Modal, Pressable } from 'react-native';
import { Formik } from 'formik';
import * as yup from 'yup';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Snackbar } from '@/components/Snackbar';

const COLORS = {
  primary: '#1E88E5',
  secondary: '#2D3748',
  background: '#FFFFFF',
  text: '#4A5568',
  error: '#E53E3E',
  border: '#E2E8F0'
};

const BUSINESS_TYPES = [
  'Restaurant',
  'Processed Food',
  'Clothing',
  'Women Clothing',
  'Pastry & Bakery',
  'Electronics',
  'Home Goods',
  'Other'
];

const validationSchema = yup.object().shape({
  businessName: yup.string()
    .required('Business name is required')
    .min(3, 'Minimum 3 characters'),
  email: yup.string().email('Invalid email'),
  phone: yup.string()
    .matches(/^[0-9]{9}$/, 'Must be exactly 9 digits')
    .required('Phone is required'),
  password: yup.string()
    .min(8, 'Minimum 8 characters')
    .matches(/[0-9]/, 'Requires at least one number')
    .matches(/[a-z]/, 'Requires at least one lowercase letter')
    .matches(/[A-Z]/, 'Requires at least one uppercase letter')
    .required('Password is required'),
  businessAddress: yup.string().required('Business address is required'),
  businessType: yup.string().required('Business type is required'),
  customCategory: yup.string().when('businessType', {
    is: (value: string) => value === 'Other',
    then: (schema) => schema
      .required('Please specify your business category')
      .min(2, 'Minimum 2 characters'),
    otherwise: (schema) => schema.notRequired()
  })
});

export default function SignupScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  
  const { register, error, errorDetails, resetError, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (error) {
      setSnackbarVisible(true);
    }
  }, [error]);

  const handleSnackbarDismiss = () => {
    setSnackbarVisible(false);
    resetError();
  };

  const handleSignup = async (values: any) => {
    try {
      const signupData = {
        businessName: values.businessName,
        email: values.email || undefined,
        phone: `237${values.phone}`,
        password: values.password,
        businessAddress: values.businessAddress,
        businessType: values.businessType === 'Other' ? values.customCategory : values.businessType
      };

      await register(signupData);
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Registration error:', err);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Formik
        initialValues={{
          businessName: '',
          email: '',
          phone: '',
          password: '',
          businessAddress: '',
          businessType: '',
          customCategory: ''
        }}
        validationSchema={validationSchema}
        onSubmit={handleSignup}
      >
        {({ handleChange, handleBlur, handleSubmit, values, errors, touched, setFieldValue }) => (
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.title}>Business Registration</Text>
            <Text style={styles.subtitle}>Create your business account</Text>

            {/* Business Name */}
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="office-building" size={20} color={COLORS.text} />
              <TextInput
                style={styles.input}
                placeholder="Legal Business Name"
                placeholderTextColor={COLORS.text}
                value={values.businessName}
                onChangeText={handleChange('businessName')}
                onBlur={handleBlur('businessName')}
              />
            </View>
            {touched.businessName && errors.businessName && (
              <Text style={styles.errorText}>{errors.businessName}</Text>
            )}

            {/* Business Address */}
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="map-marker-outline" size={20} color={COLORS.text} />
              <TextInput
                style={styles.input}
                placeholder="Business Address"
                placeholderTextColor={COLORS.text}
                value={values.businessAddress}
                onChangeText={handleChange('businessAddress')}
                onBlur={handleBlur('businessAddress')}
              />
            </View>
            {touched.businessAddress && errors.businessAddress && (
              <Text style={styles.errorText}>{errors.businessAddress}</Text>
            )}

            {/* Email */}
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="email-outline" size={20} color={COLORS.text} />
              <TextInput
                style={styles.input}
                placeholder="Business Email (Optional)"
                placeholderTextColor={COLORS.text}
                keyboardType="email-address"
                autoCapitalize="none"
                value={values.email}
                onChangeText={handleChange('email')}
                onBlur={handleBlur('email')}
              />
            </View>

            {/* Phone */}
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="whatsapp" size={20} color={COLORS.text} />
              <View style={styles.countryCode}>
                <Text style={styles.codeText}>237</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="WhatsApp Number"
                placeholderTextColor={COLORS.text}
                keyboardType="number-pad"
                value={values.phone}
                onChangeText={handleChange('phone')}
                onBlur={handleBlur('phone')}
                maxLength={9}
              />
            </View>
            {touched.phone && errors.phone && (
              <Text style={styles.errorText}>{errors.phone}</Text>
            )}

            {/* Password */}
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="lock-outline" size={20} color={COLORS.text} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Create Password"
                placeholderTextColor={COLORS.text}
                secureTextEntry={!showPassword}
                value={values.password}
                onChangeText={handleChange('password')}
                onBlur={handleBlur('password')}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <MaterialCommunityIcons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={COLORS.text}
                />
              </TouchableOpacity>
            </View>
            {touched.password && errors.password && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}

            {/* Business Category */}
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="tag-outline" size={20} color={COLORS.text} />
              <TouchableOpacity 
                style={styles.dropdownTrigger}
                onPress={() => setShowDropdown(true)}
              >
                <Text style={[styles.input, { color: values.businessType ? COLORS.secondary : COLORS.text }]}>
                  {values.businessType || 'Select Business Category'}
                </Text>
                <MaterialCommunityIcons 
                  name={showDropdown ? "chevron-up" : "chevron-down"} 
                  size={24} 
                  color={COLORS.text} 
                />
              </TouchableOpacity>
            </View>
            {touched.businessType && errors.businessType && (
              <Text style={styles.errorText}>{errors.businessType}</Text>
            )}

            {/* Custom Category */}
            {values.businessType === 'Other' && (
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons name="pencil-outline" size={20} color={COLORS.text} />
                <TextInput
                  style={styles.input}
                  placeholder="Specify Business Category"
                  placeholderTextColor={COLORS.text}
                  value={values.customCategory}
                  onChangeText={handleChange('customCategory')}
                  onBlur={handleBlur('customCategory')}
                />
              </View>
            )}
            {touched.customCategory && errors.customCategory && (
              <Text style={styles.errorText}>{errors.customCategory}</Text>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.button, isLoading && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Register Business</Text>
              )}
            </TouchableOpacity>

            {/* Login Link */}
            <TouchableOpacity
              style={styles.loginPrompt}
              onPress={() => router.replace('/(auth)/login')}
            >
              <Text style={styles.loginText}>
                Already have an account? <Text style={styles.linkText}>Login</Text>
              </Text>
            </TouchableOpacity>

            {/* Business Type Dropdown */}
            <Modal visible={showDropdown} transparent animationType="fade">
              <Pressable style={styles.modalOverlay} onPress={() => setShowDropdown(false)}>
                <View style={styles.dropdownContent}>
                  <ScrollView>
                    {BUSINESS_TYPES.map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setFieldValue('businessType', type);
                          setShowDropdown(false);
                        }}
                      >
                        <Text style={styles.dropdownItemText}>{type}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </Pressable>
            </Modal>

            {/* Success Modal */}
            <Modal visible={showSuccessModal} transparent animationType="fade">
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <MaterialCommunityIcons name="check-circle" size={48} color={COLORS.primary} />
                  <Text style={styles.modalTitle}>Registration Successful</Text>
                  <Text style={styles.modalText}>
                    Your business account has been created successfully.
                  </Text>
                  <TouchableOpacity 
                    style={styles.modalButton}
                    onPress={() => {
                      setShowSuccessModal(false);
                      router.replace('/(auth)/login');
                    }}
                  >
                    <Text style={styles.modalButtonText}>Continue to Login</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

            {/* Error Snackbar */}
            <Snackbar
              visible={snackbarVisible}
              message={error || ''}
              type="error"
              onDismiss={handleSnackbarDismiss}
              duration={4000}
            />
          </ScrollView>
        )}
      </Formik>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 24,
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
    marginBottom: 8,
    height: 50,
  },
  countryCode: {
    backgroundColor: '#F7FAFC',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  codeText: {
    color: COLORS.secondary,
    fontWeight: '500',
  },
  input: {
    flex: 1,
    marginLeft: 12,
    color: COLORS.secondary,
    fontSize: 16,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginBottom: 8,
    marginLeft: 8,
  },
  button: {
    backgroundColor: COLORS.primary,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loginPrompt: {
    marginTop: 24,
    alignItems: 'center',
  },
  loginText: {
    color: COLORS.text,
  },
  linkText: {
    color: COLORS.primary,
    fontWeight: '500',
  },
  dropdownTrigger: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownContent: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 8,
    width: '80%',
    maxHeight: '60%',
  },
  dropdownItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dropdownItemText: {
    fontSize: 16,
    color: COLORS.text,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.secondary,
    marginVertical: 16,
  },
  modalText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 16,
  },
  modalButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 16,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});