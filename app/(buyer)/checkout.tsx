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
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';
import { supabase, isSupabaseConfigured } from '../../services/supabase';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { CustomAlert } from '../../components/ui/CustomAlert';
import { Spacing, Typography, BorderRadius } from '../../constants/theme';

export default function CheckoutScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { items, totalPrice, clearCart } = useCart();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('credit');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error';
  }>({ visible: false, title: '', message: '', type: 'success' });

  const paymentMethods = [
    { id: 'credit', name: 'Cartão de Crédito', icon: 'card' },
    { id: 'debit', name: 'Cartão de Débito', icon: 'card-outline' },
    { id: 'pix', name: 'PIX', icon: 'qr-code' },
    { id: 'boleto', name: 'Boleto', icon: 'barcode' },
  ];

  const handleCheckout = async () => {
    if (!address) {
      setAlert({
        visible: true,
        title: 'Endereço obrigatório',
        message: 'Por favor, informe o endereço de entrega',
        type: 'error',
      });
      return;
    }

    if (!isSupabaseConfigured) {
      setAlert({
        visible: true,
        title: 'Supabase não conectado',
        message: 'Conecte seu projeto Supabase para finalizar pedidos reais',
        type: 'error',
      });
      return;
    }

    setLoading(true);
    try {
      // Agrupar produtos por vendedor
      const sellerGroups = new Map<string, typeof items>();
      
      for (const item of items) {
        const { data: product } = await supabase
          .from('products')
          .select('seller_id')
          .eq('id', item.id)
          .single();

        if (product) {
          const sellerId = product.seller_id;
          if (!sellerGroups.has(sellerId)) {
            sellerGroups.set(sellerId, []);
          }
          sellerGroups.get(sellerId)!.push(item);
        }
      }

      // Criar pedido para cada vendedor
      for (const [sellerId, sellerItems] of sellerGroups) {
        const orderTotal = sellerItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert([
            {
              buyer_id: user?.id,
              seller_id: sellerId,
              total_price: orderTotal,
              delivery_address: address,
              payment_method: paymentMethod,
              status: 'pending',
            },
          ])
          .select()
          .single();

        if (orderError || !order) {
          throw new Error('Erro ao criar pedido');
        }

        // Criar itens do pedido
        const orderItems = sellerItems.map((item) => ({
          order_id: order.id,
          product_id: item.id,
          quantity: item.quantity,
          price: item.price,
        }));

        const { error: itemsError } = await supabase.from('order_items').insert(orderItems);

        if (itemsError) {
          throw new Error('Erro ao criar itens do pedido');
        }

        // Atualizar estoque
        for (const item of sellerItems) {
          await supabase
            .from('products')
            .update({ stock: item.stock - item.quantity })
            .eq('id', item.id);
        }
      }

      clearCart();
      setAlert({
        visible: true,
        title: 'Pedido realizado!',
        message: 'Seu pedido foi realizado com sucesso',
        type: 'success',
      });

      setTimeout(() => {
        router.replace('/(buyer)/products');
      }, 2000);
    } catch (error) {
      setAlert({
        visible: true,
        title: 'Erro ao finalizar',
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
      <View style={[styles.header, { paddingTop: insets.top, backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Finalizar Compra</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Resumo do Pedido</Text>
          {items.map((item) => (
            <View key={item.id} style={styles.orderItem}>
              <Text style={[styles.itemName, { color: colors.text }]}>
                {item.quantity}x {item.name}
              </Text>
              <Text style={[styles.itemPrice, { color: colors.textSecondary }]}>
                R$ {(item.price * item.quantity).toFixed(2)}
              </Text>
            </View>
          ))}
          <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
            <Text style={[styles.totalPrice, { color: colors.primary }]}>
              R$ {totalPrice.toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Endereço de Entrega</Text>
          <Input
            value={address}
            onChangeText={setAddress}
            placeholder="Rua, número, bairro, cidade, CEP"
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Forma de Pagamento</Text>
          {paymentMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.paymentOption,
                {
                  backgroundColor: paymentMethod === method.id ? colors.primaryLight : colors.surface,
                  borderColor: paymentMethod === method.id ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setPaymentMethod(method.id)}
            >
              <Ionicons
                name={method.icon as any}
                size={24}
                color={paymentMethod === method.id ? colors.primary : colors.text}
              />
              <Text
                style={[
                  styles.paymentText,
                  { color: paymentMethod === method.id ? colors.primary : colors.text },
                ]}
              >
                {method.name}
              </Text>
              {paymentMethod === method.id && (
                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.card, paddingBottom: insets.bottom }]}>
        <Button
          title="Confirmar Pedido"
          onPress={handleCheckout}
          loading={loading}
          fullWidth
        />
      </View>

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
    gap: Spacing.md,
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
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  itemName: {
    ...Typography.body,
    flex: 1,
  },
  itemPrice: {
    ...Typography.body,
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.md,
    marginTop: Spacing.sm,
    borderTopWidth: 1,
  },
  totalLabel: {
    ...Typography.h4,
  },
  totalPrice: {
    ...Typography.h3,
    fontWeight: 'bold',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    gap: Spacing.md,
  },
  paymentText: {
    ...Typography.body,
    fontWeight: '600',
    flex: 1,
  },
  footer: {
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
});
