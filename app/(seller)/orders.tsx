import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { supabase, isSupabaseConfigured } from '../../services/supabase';
import { Button } from '../../components/ui/Button';
import { CustomAlert } from '../../components/ui/CustomAlert';
import { Spacing, Typography, BorderRadius, Shadows } from '../../constants/theme';

interface Order {
  id: string;
  total_price: number;
  delivery_address: string;
  payment_method: string;
  status: string;
  created_at: string;
  buyer: {
    name: string;
    email: string;
  };
  order_items?: Array<{
    id: string;
    product_id: string;
    quantity: number;
    price: number;
    product?: { name: string } | null;
  }>;
}

export default function OrdersScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<{ visible: boolean; title?: string; message?: string; type?: 'success'|'error' }>({ visible: false });
  const [deletingIds, setDeletingIds] = useState<string[]>([]);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      if (!isSupabaseConfigured) {
        setOrders([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          buyer:users!buyer_id(name, email),
          order_items(*, product:products(name))
        `)
        .eq('seller_id', user?.id)
        .order('created_at', { ascending: false });

      if (data) {
        setOrders(data.map((order: any) => ({
          ...order,
          buyer: order.buyer,
          order_items: order.order_items || [],
        })));
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return colors.success;
      case 'processing':
        return colors.warning;
      case 'cancelled':
        return colors.error;
      default:
        return colors.info;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Concluído';
      case 'processing':
        return 'Processando';
      case 'cancelled':
        return 'Cancelado';
      default:
        return 'Pendente';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderOrder = ({ item }: { item: Order }) => (
    <View style={[styles.orderCard, { backgroundColor: colors.card }, Shadows.md]}>
      <View style={styles.orderHeader}>
        <View>
          <Text style={[styles.orderDate, { color: colors.textSecondary }]}>
            {formatDate(item.created_at)}
          </Text>
          <Text style={[styles.orderPrice, { color: colors.primary }]}>
            R$ {item.total_price.toFixed(2)}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}20` }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusText(item.status)}
          </Text>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.divider }]} />

      <View style={styles.orderInfo}>
        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={16} color={colors.textSecondary} />
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Cliente:</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>{item.buyer.name}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="mail-outline" size={16} color={colors.textSecondary} />
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Email:</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>{item.buyer.email}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Endereço:</Text>
          <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={2}>
            {item.delivery_address}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="card-outline" size={16} color={colors.textSecondary} />
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Pagamento:</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>{item.payment_method}</Text>
        </View>
        <View style={{ marginTop: 8 }}>
          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 6 }]}>Produtos</Text>
          {item.order_items && item.order_items.length > 0 ? (
            item.order_items.map((it) => (
              <View key={it.id} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={[styles.infoValue, { color: colors.text }]}>{it.product?.name || 'Produto'}</Text>
                <Text style={[styles.infoValue, { color: colors.textSecondary }]}>{it.quantity}x</Text>
              </View>
            ))
          ) : (
            <Text style={[styles.infoValue, { color: colors.textSecondary }]}>Nenhum item listado</Text>
          )}
        </View>
        <View style={{ marginTop: 8 }}>
          <Button
            title="Envio realizado"
            loading={deletingIds.includes(item.id)}
            onPress={async () => {
              // prevent double clicks
              if (deletingIds.includes(item.id)) return;
              setDeletingIds((s) => [...s, item.id]);
              try {
                if (!isSupabaseConfigured) throw new Error('Supabase não configurado');
                if (!user?.id) throw new Error('Usuário não autenticado');

                // Ensure we send seller_id in the delete filter so RLS can validate ownership
                const { data, error } = await supabase
                  .from('orders')
                  .delete()
                  .match({ id: item.id, seller_id: user.id })
                  .select();

                // log for debugging server response
                console.log('delete order result', { userId: user.id, match: { id: item.id, seller_id: user.id }, data, error });

                if (error) throw error;

                // If delete succeeded, ensure we received at least one deleted row
                const deletedCount = Array.isArray(data) ? data.length : (data ? 1 : 0);
                if (deletedCount === 0) {
                  throw new Error('Nenhum pedido foi removido pelo servidor — verifique política RLS e se o pedido pertence a este vendedor');
                }

                // remove locally
                setOrders((prev) => prev.filter((o) => o.id !== item.id));
                setAlert({ visible: true, title: 'Envio realizado', message: 'Pedido removido com sucesso', type: 'success' });
              } catch (err) {
                console.error('Error deleting order:', err);
                setAlert({ visible: true, title: 'Erro', message: (err as Error).message || 'Erro ao remover pedido', type: 'error' });
              } finally {
                setDeletingIds((s) => s.filter((id) => id !== item.id));
              }
            }}
          />
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Pedidos</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <>
          <FlatList
            data={orders}
            renderItem={renderOrder}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="receipt-outline" size={64} color={colors.textLight} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  Nenhum pedido recebido
                </Text>
              </View>
            }
          />
          <CustomAlert
            visible={alert.visible}
            title={alert.title || ''}
            message={alert.message || ''}
            type={alert.type === 'success' ? 'success' : 'error'}
            onConfirm={() => setAlert({ visible: false })}
          />
        </>
      )}
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
  orderCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderDate: {
    ...Typography.bodySmall,
    marginBottom: Spacing.xs,
  },
  orderPrice: {
    ...Typography.h3,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.round,
  },
  statusText: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: Spacing.xs,
  },
  orderInfo: {
    gap: Spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
  },
  infoLabel: {
    ...Typography.bodySmall,
    minWidth: 80,
  },
  infoValue: {
    ...Typography.bodySmall,
    fontWeight: '600',
    flex: 1,
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
});
