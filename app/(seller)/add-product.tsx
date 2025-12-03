import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
// router hooks
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { useProducts } from '../../hooks/useProducts';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { CustomAlert } from '../../components/ui/CustomAlert';
import { Spacing, Typography, BorderRadius } from '../../constants/theme';
import { pickImage, uploadProductImage, requestMediaPermission } from '../../services/uploadImage';

interface Category {
  id: string;
  name: string;
}

export default function AddProductScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { categories, fetchCategories, addProduct, updateProduct, products, deleteProduct } = useProducts();
  const router = useRouter();
  const params: any = useLocalSearchParams();
  const productId = params?.id as string | undefined;

  const [isEditing, setIsEditing] = useState(false);
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [alert, setAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error';
  }>({ visible: false, title: '', message: '', type: 'success' });

  const handlePickImage = async () => {
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
        setImageUri(result.uri);
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

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (productId) {
      const p = products.find((x) => x.id === productId);
      if (p) {
        setIsEditing(true);
        setName(p.name);
        setPrice(String(p.price));
        setStock(String(p.stock));
        setDescription(p.description || '');
        setCategoryId(p.category_id || '');
        if (p.image_url) setImageUri(p.image_url);
      }
    }
  }, [productId, products]);

  const loadCategories = async () => {
    await fetchCategories();
  };

  const handleAddProduct = async () => {
    if (!name || !price || !stock) {
      setAlert({
        visible: true,
        title: 'Campos obrigatórios',
        message: 'Preencha nome, preço e quantidade',
        type: 'error',
      });
      return;
    }

    const priceNum = parseFloat(price);
    const stockNum = parseInt(stock);

    if (isNaN(priceNum) || priceNum <= 0) {
      setAlert({
        visible: true,
        title: 'Preço inválido',
        message: 'Informe um preço válido',
        type: 'error',
      });
      return;
    }

    if (isNaN(stockNum) || stockNum < 0) {
      setAlert({
        visible: true,
        title: 'Quantidade inválida',
        message: 'Informe uma quantidade válida',
        type: 'error',
      });
      return;
    }

    setLoading(true);
    try {
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      let finalImageUrl = '';
      if (imageUri) {
        setUploading(true);
        finalImageUrl = await uploadProductImage(user.id, imageUri);
      }

      if (isEditing && productId) {
        await updateProduct(productId, {
          seller_id: user.id,
          category_id: categoryId || null,
          name,
          description,
          price: priceNum,
          stock: stockNum,
          image_url: finalImageUrl,
        });

        setAlert({ visible: true, title: 'Produto atualizado!', message: 'As alterações foram salvas', type: 'success' });
        setTimeout(() => router.back(), 1200);
      } else {
        await addProduct({
          seller_id: user.id,
          category_id: categoryId || null,
          name,
          description,
          price: priceNum,
          stock: stockNum,
          image_url: finalImageUrl,
        });

        setAlert({ visible: true, title: 'Produto adicionado!', message: 'Seu produto foi cadastrado com sucesso', type: 'success' });
        setTimeout(() => router.back(), 1200);
      }
    } catch (error) {
      setAlert({
        visible: true,
        title: 'Erro ao adicionar',
        message: error instanceof Error ? error.message : 'Tente novamente',
        type: 'error',
      });
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!productId) return;
    setLoading(true);
    try {
      await deleteProduct(productId);
      setAlert({ visible: true, title: 'Produto excluído', message: 'Produto removido com sucesso', type: 'success' });
      setTimeout(() => router.replace('/(seller)/products'), 1000);
    } catch (err) {
      setAlert({ visible: true, title: 'Erro', message: (err as Error).message || 'Erro ao excluir', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.header, { paddingTop: insets.top, backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Adicionar Produto</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.form, { backgroundColor: colors.card }]}>
          <Input
            label="Nome do Produto *"
            value={name}
            onChangeText={setName}
            placeholder="Ex: Notebook Dell"
          />

          <View>
            <Text style={[styles.label, { color: colors.text }]}>Categoria *</Text>
            <View style={[styles.pickerContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Picker
                selectedValue={categoryId}
                onValueChange={setCategoryId}
                style={{ color: colors.text }}
              >
                {categories.map((cat) => (
                  <Picker.Item key={cat.id} label={cat.name} value={cat.id} />
                ))}
              </Picker>
            </View>
          </View>

          <Input
            label="Preço *"
            value={price}
            onChangeText={setPrice}
            placeholder="0.00"
            keyboardType="numeric"
          />

          <Input
            label="Quantidade em Estoque *"
            value={stock}
            onChangeText={setStock}
            placeholder="0"
            keyboardType="numeric"
          />

          <View>
            <Text style={[styles.label, { color: colors.text }]}>Foto do Produto</Text>
            {imageUri && (
              <Image
                source={{ uri: imageUri }}
                style={styles.imagePreview}
                contentFit="cover"
              />
            )}
            <Button
              title={imageUri ? 'Trocar Foto' : 'Selecionar Foto'}
              onPress={handlePickImage}
              variant="outline"
              fullWidth
            />
          </View>

          <Input
            label="Descrição"
            value={description}
            onChangeText={setDescription}
            placeholder="Descreva seu produto..."
            multiline
            numberOfLines={4}
          />

          <Button
            title={isEditing ? 'Salvar Alterações' : 'Adicionar Produto'}
            onPress={handleAddProduct}
            loading={loading}
            fullWidth
          />
          {isEditing && (
            <Button
              title="Excluir Produto"
              variant="outline"
              onPress={handleDelete}
              loading={loading}
              fullWidth
            />
          )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerTitle: {
    ...Typography.h4,
  },
  placeholder: {
    width: 24,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  form: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  label: {
    ...Typography.bodySmall,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  pickerContainer: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
});
