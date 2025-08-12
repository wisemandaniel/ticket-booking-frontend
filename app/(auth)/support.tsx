import { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  Linking, 
  Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const COLORS = {
  primary: '#1E88E5',
  secondary: '#2D3748',
  background: '#FFFFFF',
  text: '#4A5568',
  error: '#E53E3E',
  border: '#E2E8F0'
};

export default function ContactSupportScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [activeFAQ, setActiveFAQ] = useState<number | null>(null);

  const faqItems = [
    {
      question: "How do I reset my password?",
      answer: "Visit the login screen and click 'Forgot Password' to reset your password via email."
    },
    {
      question: "What are your support hours?",
      answer: "Our support team is available 24/7 through chat and email."
    },
    {
      question: "How long for response?",
      answer: "We typically respond within 1 business day."
    }
  ];

  const handleSubmit = () => {
    // Implement form submission logic
    Alert.alert('Thank You', 'Your message has been submitted');
    setName('');
    setEmail('');
    setMessage('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Contact Support</Text>
          <Text style={styles.subtitle}>We're here to help with any business inquiries</Text>
        </View>

        {/* Contact Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Contact</Text>

        <TouchableOpacity 
        style={styles.contactCard}
        onPress={() => Linking.openURL('whatsapp://send?phone=237678313613')}
        >
            <MaterialCommunityIcons name="whatsapp" size={24} color="#25D366" />
            <View style={styles.contactInfo}>
                <Text style={styles.contactTitle}>WhatsApp Support</Text>
                <Text style={styles.contactDetail}>+237 678 313 613</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.contactCard}
            onPress={() => Linking.openURL('tel:+237678313613')}
          >
            <MaterialCommunityIcons name="phone" size={24} color={COLORS.primary} />
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>Call Support</Text>
              <Text style={styles.contactDetail}>+ (237) 678-313-613  </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.contactCard}
            onPress={() => Linking.openURL('mailto:support@anyware.com')}
          >
            <MaterialCommunityIcons name="email" size={24} color={COLORS.primary} />
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>Email Us</Text>
              <Text style={styles.contactDetail}>support@anyware.com</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Contact Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Send Message</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Your Name"
            placeholderTextColor={COLORS.text}
            value={name}
            onChangeText={setName}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Your Email"
            placeholderTextColor={COLORS.text}
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          
          <TextInput
            style={[styles.input, styles.messageInput]}
            placeholder="Your Message"
            placeholderTextColor={COLORS.text}
            multiline
            numberOfLines={4}
            value={message}
            onChangeText={setMessage}
          />
          
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.buttonText}>Send Message</Text>
          </TouchableOpacity>
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FAQs</Text>
          
          {faqItems.map((item, index) => (
            <View key={index} style={styles.faqItem}>
              <TouchableOpacity 
                style={styles.faqQuestion}
                onPress={() => setActiveFAQ(activeFAQ === index ? null : index)}
              >
                <Text style={styles.faqQuestionText}>{item.question}</Text>
                <MaterialCommunityIcons 
                  name={activeFAQ === index ? 'chevron-up' : 'chevron-down'} 
                  size={24} 
                  color={COLORS.text} 
                />
              </TouchableOpacity>
              
              {activeFAQ === index && (
                <Text style={styles.faqAnswer}>{item.answer}</Text>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 30,
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
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.secondary,
    marginBottom: 15,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  contactInfo: {
    marginLeft: 15,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.secondary,
  },
  contactDetail: {
    fontSize: 14,
    color: COLORS.text,
    marginTop: 4,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    color: COLORS.secondary,
  },
  messageInput: {
    height: 120,
    textAlignVertical: 'top',
    paddingTop: 15,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.background,
    fontWeight: '600',
    fontSize: 16,
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 10,
  },
  faqQuestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
  },
  faqQuestionText: {
    flex: 1,
    color: COLORS.secondary,
    fontSize: 16,
  },
  faqAnswer: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 20,
    paddingBottom: 15,
  },
});