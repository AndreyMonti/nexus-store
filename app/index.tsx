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
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { CustomAlert } from '../components/ui/CustomAlert';
import { Spacing, Typography, BorderRadius } from '../constants/theme';

export default function LoginScreen() {
  const { colors } = useTheme();
  const { login, user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error';
  }>({ visible: false, title: '', message: '', type: 'info' });

  // Redirecionar quando usuário fizer login com sucesso
  React.useEffect(() => {
    if (user) {
      if (user.userType === 'buyer') {
        router.replace('/(buyer)/products');
      } else {
        router.replace('/(seller)/products');
      }
    }
  }, [user, router]);

  const handleLogin = async () => {
    if (!email || !password) {
      setAlert({
        visible: true,
        title: 'Campos obrigatórios',
        message: 'Por favor, preencha email e senha',
        type: 'error',
      });
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
    } catch (error) {
      setAlert({
        visible: true,
        title: 'Erro ao entrar',
        message: error instanceof Error ? error.message : 'Verifique suas credenciais',
        type: 'error',
      });
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoContainer}>
          <Image
            source="https://cdn-ai.onspace.ai/onspace/files/4cWipojzEvVe5vVSTLvBrB/WhatsApp_Image_2025-10-06_at_20.41.21__1_-removebg-preview.png"
            style={styles.logo}
            contentFit="contain"
          />
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.text }]}>Bem-vindo!</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Entre com sua conta para continuar
          </Text>

          <View style={styles.form}>
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

            <Button title="Entrar" onPress={handleLogin} loading={loading} fullWidth />

            <TouchableOpacity
              style={styles.registerButton}
              onPress={() => router.push('/register')}
            >
              <Text style={[styles.registerText, { color: colors.textSecondary }]}>
                Não tem uma conta?{' '}
                <Text style={{ color: colors.primary, fontWeight: '600' }}>Cadastre-se</Text>
              </Text>
            </TouchableOpacity>
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
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logo: {
    width: 200,
    height: 200,
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
  registerButton: {
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  registerText: {
    ...Typography.body,
  },
});
