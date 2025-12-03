import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { CustomAlert } from '../../components/ui/CustomAlert';
import { Spacing, Typography, BorderRadius, Shadows } from '../../constants/theme';
import { pickImage, uploadAvatarImage, requestMediaPermission } from '../../services/uploadImage';

export default function BuyerProfileScreen() {
  const { colors, mode, toggleTheme } = useTheme();
  const { user, logout, updateProfile } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState(user?.name || '');
  const [photoUrl, setPhotoUrl] = useState(user?.photoUrl || '');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [alert, setAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error';
  }>({ visible: false, title: '', message: '', type: 'success' });

  const handlePickAvatar = async () => {
    try {
      const hasPermission = await requestMediaPermission();
      if (!hasPermission) {
        setAlert({
          visible: true,
          title: 'Permissão necessária',
          message: 'Permita acesso à galeria de fotos',
          type: 'error',
        });
        return;
      }

      const result = await pickImage();
      if (result) {
        setAvatarUri(result.uri);
      }
    } catch (error) {
      setAlert({
        visible: true,
        title: 'Erro',
        message: error instanceof Error ? error.message : 'Erro ao selecionar imagem',
        type: 'error',
      });
    }
  };

  const handleUpdateProfile = async () => {
    if (!name) {
      setAlert({
        visible: true,
        title: 'Nome obrigatório',
        message: 'Por favor, informe seu nome',
        type: 'error',
      });
      return;
    }

    setLoading(true);
    try {
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      let finalPhotoUrl = photoUrl;
      if (avatarUri) {
        setUploading(true);
        finalPhotoUrl = await uploadAvatarImage(user.id, avatarUri);
        setAvatarUri(null);
      }

      await updateProfile(name, finalPhotoUrl);
      setPhotoUrl(finalPhotoUrl);

      setAlert({
        visible: true,
        title: 'Perfil atualizado!',
        message: 'Suas informações foram atualizadas',
        type: 'success',
      });
    } catch (error) {
      setAlert({
        visible: true,
        title: 'Erro ao atualizar',
        message: error instanceof Error ? error.message : 'Tente novamente',
        type: 'error',
      });
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Perfil</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.profileHeader, { backgroundColor: colors.card }]}>
          <TouchableOpacity
            style={[styles.avatarContainer, { borderColor: colors.primary }]}
            onPress={handlePickAvatar}
          >
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} contentFit="cover" />
            ) : photoUrl ? (
              <Image source={photoUrl} style={styles.avatar} contentFit="cover" />
            ) : (
              <Ionicons name="person" size={60} color={colors.textLight} />
            )}
            <View style={[styles.avatarEditBadge, { backgroundColor: colors.primary }]}>
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <Text style={[styles.userName, { color: colors.text }]}>{user?.name}</Text>
          <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{user?.email}</Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Informações Pessoais</Text>

          <Input label="Nome" value={name} onChangeText={setName} placeholder="Seu nome" />

          <Input
            label="Email"
            value={user?.email || ''}
            onChangeText={() => {}}
            placeholder="Email"
            editable={false}
          />

          <Button
            title="Salvar Alterações"
            onPress={handleUpdateProfile}
            loading={loading}
            fullWidth
          />
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Preferências</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons
                name={mode === 'dark' ? 'moon' : 'sunny'}
                size={24}
                color={colors.text}
              />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>Modo Escuro</Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  Alterar tema do aplicativo
                </Text>
              </View>
            </View>
            <Switch
              value={mode === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.disabled, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color={colors.error} />
            <Text style={[styles.logoutText, { color: colors.error }]}>Sair da Conta</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onConfirm={() => setAlert({ ...alert, visible: false })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerTitle: {
    ...Typography.h3,
  },
  scrollContent: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  profileHeader: {
    alignItems: 'center',
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  userName: {
    ...Typography.h3,
  },
  userEmail: {
    ...Typography.body,
  },
  section: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h4,
    marginBottom: Spacing.sm,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    ...Typography.body,
    fontWeight: '600',
  },
  settingDescription: {
    ...Typography.bodySmall,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  logoutText: {
    ...Typography.body,
    fontWeight: '600',
  },
});
