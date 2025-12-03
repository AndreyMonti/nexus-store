import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useCart } from '../../hooks/useCart';
import { supabase, isSupabaseConfigured } from '../../services/supabase';
import { Button } from '../../components/ui/Button';
import { CustomAlert } from '../../components/ui/CustomAlert';
import { Spacing, Typography, BorderRadius } from '../../constants/theme';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  image_url?: string;
}

export default function ProductDetailScreen() {
  const { colors } = useTheme();
  const { addToCart } = useCart();
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error';
  }>({ visible: false, title: '', message: '', type: 'success' });

  useEffect(() => {
    loadProduct();
  }, [params.id]);

  const loadProduct = async () => {
    try {
      if (!isSupabaseConfigured) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', params.id)
        .single();

      if (data) setProduct(data);
    } catch (error) {
      console.error('Error loading product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;

    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity,
      imageUrl: product.image_url,
      stock: product.stock,
    });

    setAlert({
      visible: true,
      title: 'Adicionado ao carrinho!',
      message: `${quantity}x ${product.name} adicionado com sucesso`,
      type: 'success',
    });
  };

  const handleBuyNow = () => {
    handleAddToCart();
    setTimeout(() => {
      router.push('/(buyer)/checkout');
    }, 500);
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>Produto não encontrado</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Detalhes</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Image
          source={product.image_url || 'https://via.placeholder.com/400'}
          style={styles.productImage}
          contentFit="cover"
        />

        <View style={[styles.content, { backgroundColor: colors.card }]}>
          <Text style={[styles.productName, { color: colors.text }]}>{product.name}</Text>

          <Text style={[styles.productPrice, { color: colors.primary }]}>
            R$ {product.price.toFixed(2)}
          </Text>

          <View style={styles.stockContainer}>
            <Ionicons name="cube-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.stockText, { color: colors.textSecondary }]}>
              {product.stock} unidades disponíveis
            </Text>
          </View>

          {product.description && (
            <View style={styles.descriptionContainer}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Descrição</Text>
              <Text style={[styles.description, { color: colors.textSecondary }]}>
                {product.description}
              </Text>
            </View>
          )}

          <View style={styles.quantityContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Quantidade</Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity
                style={[styles.quantityButton, { backgroundColor: colors.surface }]}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Ionicons name="remove" size={20} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.quantityText, { color: colors.text }]}>{quantity}</Text>
              <TouchableOpacity
                style={[styles.quantityButton, { backgroundColor: colors.surface }]}
                onPress={() => setQuantity(Math.min(product.stock, quantity + 1))}
              >
                <Ionicons name="add" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.card, paddingBottom: insets.bottom }]}>
        <View style={styles.footerButtons}>
          <Button
            title="Adicionar ao Carrinho"
            onPress={handleAddToCart}
            variant="outline"
            fullWidth
          />
          <Button title="Comprar Agora" onPress={handleBuyNow} fullWidth />
        </View>
      </View>

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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    ...Typography.h4,
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    flexGrow: 1,
  },
  productImage: {
    width: '100%',
    height: 300,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  productName: {
    ...Typography.h2,
  },
  productPrice: {
    ...Typography.h1,
    fontWeight: 'bold',
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  stockText: {
    ...Typography.bodySmall,
  },
  descriptionContainer: {
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h4,
  },
  description: {
    ...Typography.body,
    lineHeight: 24,
  },
  quantityContainer: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    ...Typography.h3,
    minWidth: 40,
    textAlign: 'center',
  },
  footer: {
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  footerButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    ...Typography.body,
  },
});
