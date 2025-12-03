import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';
import { useAuth } from '../../../hooks/useAuth';
import { useProducts } from '../../../hooks/useProducts';
import { Button } from '../../../components/ui/Button';
import { CustomAlert } from '../../../components/ui/CustomAlert';
import { Spacing, Typography, BorderRadius, Shadows } from '../../../constants/theme';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  image_url?: string;
}

export default function SellerProductsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { products, loading, fetchProducts, deleteProduct } = useProducts();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [confirmAlert, setConfirmAlert] = React.useState<{ visible: boolean; productId?: string; title?: string; message?: string }>({ visible: false });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    await fetchProducts({ sellerId: user?.id });
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <View style={[styles.productCard, { backgroundColor: colors.card }, Shadows.sm]}>
      <Image
        source={item.image_url || 'https://via.placeholder.com/80'}
        style={styles.productImage}
        contentFit="cover"
      />
      <View style={styles.productInfo}>
        <Text style={[styles.productName, { color: colors.text }]} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={[styles.productPrice, { color: colors.primary }]}>
          R$ {item.price.toFixed(2)}
        </Text>
        <View style={styles.stockRow}>
          <Ionicons
            name="cube-outline"
            size={14}
            color={item.stock > 0 ? colors.success : colors.error}
          />
          <Text
            style={[
              styles.stockText,
              { color: item.stock > 0 ? colors.success : colors.error },
            ]}
          >
            {item.stock > 0 ? `${item.stock} em estoque` : 'Sem estoque'}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
          <Button
            title="Editar"
            variant="outline"
            onPress={() => router.push(`/(seller)/add-product?id=${item.id}`)}
          />
          <Button
            title="Excluir"
            variant="outline"
            onPress={() => setConfirmAlert({ visible: true, productId: item.id, title: 'Excluir Produto', message: 'Deseja realmente excluir este produto?' })}
          />
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Meus Produtos</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/(seller)/add-product')}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="cube-outline" size={64} color={colors.textLight} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Nenhum produto cadastrado
              </Text>
              <TouchableOpacity
                style={[styles.emptyButton, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/(seller)/add-product')}
              >
                <Text style={styles.emptyButtonText}>Adicionar Produto</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      <CustomAlert
        visible={confirmAlert.visible}
        title={confirmAlert.title || 'Confirmar'}
        message={confirmAlert.message || ''}
        type="error"
        onConfirm={async () => {
          if (confirmAlert.productId) {
            try {
              await deleteProduct(confirmAlert.productId);
              setConfirmAlert({ visible: false });
            } catch (err) {
              setConfirmAlert({ visible: false });
            }
          }
        }}
        onCancel={() => setConfirmAlert({ visible: false })}
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
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerTitle: {
    ...Typography.h3,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  productCard: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
  },
  productInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  productName: {
    ...Typography.body,
    fontWeight: '600',
  },
  productPrice: {
    ...Typography.h4,
    fontWeight: 'bold',
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  stockText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing.xxl,
    gap: Spacing.md,
  },
  emptyText: {
    ...Typography.body,
  },
  emptyButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  emptyButtonText: {
    ...Typography.body,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
