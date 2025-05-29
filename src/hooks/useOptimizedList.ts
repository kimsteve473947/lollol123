import { useCallback, useMemo } from 'react';
import { ListRenderItem } from 'react-native';

interface UseOptimizedListProps<T> {
  data: T[];
  keyExtractor: (item: T, index: number) => string;
  renderItem: ListRenderItem<T>;
  itemHeight?: number;
  windowSize?: number;
  initialNumToRender?: number;
  maxToRenderPerBatch?: number;
  removeClippedSubviews?: boolean;
}

export const useOptimizedList = <T>({
  data,
  keyExtractor,
  renderItem,
  itemHeight = 80,
  windowSize = 10,
  initialNumToRender = 20,
  maxToRenderPerBatch = 10,
  removeClippedSubviews = true,
}: UseOptimizedListProps<T>) => {
  
  const getItemLayout = useCallback(
    (data: T[] | null | undefined, index: number) => ({
      length: itemHeight,
      offset: itemHeight * index,
      index,
    }),
    [itemHeight]
  );

  const optimizedRenderItem = useCallback<ListRenderItem<T>>(
    (info) => renderItem(info),
    [renderItem]
  );

  const optimizedKeyExtractor = useCallback(
    (item: T, index: number) => keyExtractor(item, index),
    [keyExtractor]
  );

  const listProps = useMemo(() => ({
    data,
    renderItem: optimizedRenderItem,
    keyExtractor: optimizedKeyExtractor,
    getItemLayout,
    windowSize,
    initialNumToRender,
    maxToRenderPerBatch,
    removeClippedSubviews,
    showsVerticalScrollIndicator: false,
  }), [
    data,
    optimizedRenderItem,
    optimizedKeyExtractor,
    getItemLayout,
    windowSize,
    initialNumToRender,
    maxToRenderPerBatch,
    removeClippedSubviews,
  ]);

  return listProps;
};

export default useOptimizedList; 