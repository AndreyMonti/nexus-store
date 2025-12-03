import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useCart } from '../../hooks/useCart';
import { Button } from '../../components/ui/Button';
import { CustomAlert } from '../../components/ui/CustomAlert';
import { Spacing, Typography, BorderRadius, Shadows } from '../../constants/theme';

export default function CartScreen() {
  const { colors } = useTheme();
  const { items, removeFromCart, updateQuantity, totalPrice } = useCart();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [alert, setAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error';
    onConfirm?: () => void;
  }>({ visible: false, title: '', message: '', type: 'success' });

  const handleRemove = (productId: string, productName: string) => {
    setAlert({
      visible: true,
      title: 'Remover produto',
      message: `Deseja remover ${productName} do carrinho?`,
      type: 'warning',
      onConfirm: () => {
        removeFromCart(productId);
        setAlert({ ...alert, visible: false });
      },
    });
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      setAlert({
        visible: true,
        title: 'Carrinho vazio',
        message: 'Adicione produtos ao carrinho antes de finalizar',
        type: 'error',
      });
      return;
    }
    router.push('/(buyer)/checkout');
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={[styles.cartItem, { backgroundColor: colors.card }, Shadows.sm]}>
      <Image
        source={item.imageUrl || 'https://via.placeholder.com/80'}
        style={styles.itemImage}
        contentFit="cover"
      />

      <View style={styles.itemInfo}>
        <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={[styles.itemPrice, { color: colors.primary }]}>
          R$ {item.price.toFixed(2)}
        </Text>

        <View style={styles.quantityControls}>
          <TouchableOpacity
            style={[styles.quantityButton, { backgroundColor: colors.surface }]}
            onPress={() => updateQuantity(item.id, item.quantity - 1)}
          >
            <Ionicons name="remove" size={16} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.quantityText, { color: colors.text }]}>{item.quantity}</Text>
          <TouchableOpacity
            style={[styles.quantityButton, { backgroundColor: colors.surface }]}
            onPress={() => updateQuantity(item.id, item.quantity + 1)}
          >
            <Ionicons name="add" size={16} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemove(item.id, item.name)}
      >
        <Ionicons name="trash-outline" size={20} color={colors.error} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Carrinho</Text>
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={80} color={colors.textLight} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Carrinho vazio</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Adicione produtos ao seu carrinho
          </Text>
          <Button
            title="Continuar comprando"
            onPress={() => router.push('/(buyer)/products')}
            variant="primary"
          />
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
          />

          <View style={[styles.footer, { backgroundColor: colors.card, paddingBottom: insets.bottom }]}>
            <View style={styles.totalContainer}>
              <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Total</Text>
              <Text style={[styles.totalPrice, { color: colors.primary }]}>
                R$ {totalPrice.toFixed(2)}
              </Text>
            </View>
            <Button title="Finalizar Compra" onPress={handleCheckout} fullWidth />
          </View>
        </>
      )}

      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onConfirm={alert.onConfirm || (() => setAlert({ ...alert, visible: false }))}
        onCancel={alert.onConfirm ? () => setAlert({ ...alert, visible: false }) : undefined}
        confirmText={alert.onConfirm ? 'Remover' : 'OK'}
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
  listContent: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  cartItem: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
  },
  itemInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  itemName: {
    ...Typography.body,
    fontWeight: '600',
  },
  itemPrice: {
    ...Typography.h4,
    fontWeight: 'bold',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    ...Typography.body,
    fontWeight: '600',
    minWidth: 24,
    textAlign: 'center',
  },
  removeButton: {
    padding: Spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  emptyTitle: {
    ...Typography.h3,
  },
  emptyText: {
    ...Typography.body,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  footer: {
    padding: Spacing.md,
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    ...Typography.h4,
  },
  totalPrice: {
    ...Typography.h2,
    fontWeight: 'bold',
  },
});
