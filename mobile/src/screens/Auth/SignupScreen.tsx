import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { theme } from '../../styles/theme';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';

export default function SignupScreen({ navigation }: any) {
  const { signup } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    general?: string;
  }>({});
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (/^[a-zA-Z]+$/.test(password)) {
      newErrors.password = 'Password must contain a number or special character';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    try {
      await signup(email.trim().toLowerCase(), password, fullName.trim());
      // Navigation happens automatically via AuthContext → AppNavigator
    } catch (error: any) {
      const detail = error.response?.data?.detail;
      if (typeof detail === 'string') {
        if (detail.toLowerCase().includes('email')) {
          setErrors({ email: detail });
        } else {
          setErrors({ general: detail });
        }
      } else if (Array.isArray(detail)) {
        // Pydantic validation errors
        const fieldErrors: typeof errors = {};
        detail.forEach((err: any) => {
          const field = err.loc?.[1];
          if (field === 'password') fieldErrors.password = err.msg;
          else if (field === 'email') fieldErrors.email = err.msg;
          else fieldErrors.general = err.msg;
        });
        setErrors(fieldErrors);
      } else {
        setErrors({ general: 'Something went wrong. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <MaterialIcons name="menu-book" size={40} color={theme.colors.primary} />
            <Text style={styles.logoText}>Reado</Text>
          </View>
          <Text style={styles.title}>Create Account</Text>
        </View>

        <View style={styles.form}>
          {errors.general && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{errors.general}</Text>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>FULL NAME</Text>
            <View style={[styles.inputWrapper, errors.fullName && styles.inputError]}>
              <MaterialIcons name="person-outline" size={20} color={theme.colors.onSurfaceVariant} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="John Doe"
                placeholderTextColor={theme.colors.outline}
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
            </View>
            {errors.fullName && <Text style={styles.fieldError}>{errors.fullName}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>EMAIL ADDRESS</Text>
            <View style={[styles.inputWrapper, errors.email && styles.inputError]}>
              <MaterialIcons name="mail-outline" size={20} color={theme.colors.onSurfaceVariant} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="name@domain.com"
                placeholderTextColor={theme.colors.outline}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            {errors.email && <Text style={styles.fieldError}>{errors.email}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>PASSWORD</Text>
            <View style={[styles.inputWrapper, errors.password && styles.inputError]}>
              <MaterialIcons name="lock-outline" size={20} color={theme.colors.onSurfaceVariant} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="••••••••"
                placeholderTextColor={theme.colors.outline}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <MaterialIcons
                  name={showPassword ? "visibility" : "visibility-off"}
                  size={20}
                  color={theme.colors.onSurfaceVariant}
                />
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={styles.fieldError}>{errors.password}</Text>}
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={theme.colors.onPrimary} />
            ) : (
              <View style={styles.buttonContent}>
                <Text style={styles.buttonText}>Sign Up</Text>
                <MaterialIcons name="arrow-forward" size={20} color={theme.colors.onPrimary} />
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkContainer}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.linkText}>
              Already have an account? <Text style={styles.linkBold}>Log In</Text>
            </Text>
          </TouchableOpacity>

          {/* Footer Community Section */}
          <View style={styles.footer}>
            <View style={styles.featureCard}>
              <View style={styles.featureIconContainer}>
                <MaterialIcons name="bolt" size={24} color={theme.colors.primary} />
              </View>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>STREAK SYSTEM</Text>
                <Text style={styles.featureDescription}>Gamify your reading goals with athletic-style metrics.</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  logoText: {
    ...theme.typography.h2,
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  title: {
    ...theme.typography.h1,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  form: {
    width: '100%',
  },
  errorBanner: {
    backgroundColor: 'rgba(255, 71, 87, 0.1)',
    borderColor: theme.colors.error,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  errorBannerText: {
    color: theme.colors.error,
    fontSize: 14,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    ...theme.typography.labelCaps,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 10,
    fontSize: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceContainer,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    height: '100%',
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  passwordInput: {
    paddingRight: 10,
  },
  eyeButton: {
    padding: 4,
  },
  fieldError: {
    color: theme.colors.error,
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    ...theme.typography.h3,
    color: theme.colors.onPrimary,
    fontSize: 18,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.outlineVariant,
  },
  dividerText: {
    ...theme.typography.labelCaps,
    color: theme.colors.onSurfaceVariant,
    paddingHorizontal: 16,
    fontSize: 11,
  },
  socialContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceContainer,
    borderRadius: 12,
    height: 56,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    gap: 10,
  },
  socialIcon: {
    opacity: 0.9,
  },
  socialButtonText: {
    ...theme.typography.bodyMd,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  linkContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  linkText: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 14,
  },
  linkBold: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.outlineVariant,
    paddingTop: 32,
    gap: 24,
  },
  communityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarGroup: {
    flexDirection: 'row',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: theme.colors.background,
  },
  communityTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  communityText: {
    ...theme.typography.labelCaps,
    color: theme.colors.onSurfaceVariant,
    fontSize: 12,
  },
  featureCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    gap: 16,
    alignItems: 'center',
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(2, 211, 138, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    ...theme.typography.labelCaps,
    color: theme.colors.primary,
    fontSize: 11,
    marginBottom: 4,
  },
  featureDescription: {
    ...theme.typography.bodySm,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 18,
  },
});
