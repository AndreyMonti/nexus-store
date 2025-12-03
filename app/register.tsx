import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useAuth, UserType } from '../hooks/useAuth';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { CustomAlert } from '../components/ui/CustomAlert';
import { Spacing, Typography, BorderRadius } from '../constants/theme';

export default function RegisterScreen() {
  const { colors } = useTheme();
  const { register } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState<UserType>('buyer');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error';
  }>({ visible: false, title: '', message: '', type: 'info' });

  const handleRegister = async () => {
    if (!name || !email || !password) {
      setAlert({
        visible: true,
        title: 'Campos obrigatórios',
        message: 'Por favor, preencha todos os campos',
        type: 'error',
      });
      return;
    }

    setLoading(true);
    try {
      await register(email, password, name, userType);
      setAlert({
        visible: true,
        title: 'Conta criada!',
        message: 'Sua conta foi criada com sucesso',
        type: 'success',
      });
      setTimeout(() => {
        if (userType === 'buyer') {
          router.replace('/(buyer)/products');
        } else {
          router.replace('/(seller)/products');
        }
      }, 1500);
    } catch (error) {
      setAlert({
        visible: true,
        title: 'Erro ao cadastrar',
        message: error instanceof Error ? error.message : 'Tente novamente',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + Spacing.md }]}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.text }]}>Criar Conta</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Preencha os dados para começar
          </Text>

          <View style={styles.form}>
            <Input label="Nome completo" value={name} onChangeText={setName} placeholder="Seu nome" />

            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="seu@email.com"
              keyboardType="email-address"
            />

            <Input
              label="Senha"
              value={password}
              onChangeText={setPassword}
              placeholder="********"
              secureTextEntry
            />

            <View style={styles.userTypeContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Tipo de conta</Text>
              <View style={styles.userTypeButtons}>
                <TouchableOpacity
                  style={[
                    styles.userTypeButton,
                    {
                      backgroundColor: userType === 'buyer' ? colors.primary : colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => setUserType('buyer')}
                >
                  <Ionicons
                    name="cart"
                    size={24}
                    color={userType === 'buyer' ? '#FFFFFF' : colors.text}
                  />
                  <Text
                    style={[
                      styles.userTypeText,
                      { color: userType === 'buyer' ? '#FFFFFF' : colors.text },
                    ]}
                  >
                    Comprador
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.userTypeButton,
                    {
                      backgroundColor: userType === 'seller' ? colors.primary : colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => setUserType('seller')}
                >
                  <Ionicons
                    name="storefront"
                    size={24}
                    color={userType === 'seller' ? '#FFFFFF' : colors.text}
                  />
                  <Text
                    style={[
                      styles.userTypeText,
                      { color: userType === 'seller' ? '#FFFFFF' : colors.text },
                    ]}
                  >
                    Vendedor
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <Button title="Cadastrar" onPress={handleRegister} loading={loading} fullWidth />
          </View>
        </View>
      </ScrollView>

      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onConfirm={() => setAlert({ ...alert, visible: false })}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  backButton: {
    marginBottom: Spacing.lg,
  },
  card: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
  },
  title: {
    ...Typography.h2,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    marginBottom: Spacing.xl,
  },
  form: {
    gap: Spacing.md,
  },
  userTypeContainer: {
    marginVertical: Spacing.sm,
  },
  label: {
    ...Typography.bodySmall,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  userTypeButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  userTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  userTypeText: {
    ...Typography.body,
    fontWeight: '600',
  },
});
