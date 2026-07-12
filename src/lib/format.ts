export function formatNaira(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function getEffectivePrice(product: { price: number; sale_price: number | null }): number {
  return product.sale_price && product.sale_price > 0 ? product.sale_price : product.price;
}

export function isOnSale(product: { price: number; sale_price: number | null }): boolean {
  return !!(product.sale_price && product.sale_price > 0 && product.sale_price < product.price);
}

export function getDiscountPercent(product: { price: number; sale_price: number | null }): number {
  if (!isOnSale(product)) return 0;
  return Math.round(((product.price - product.sale_price!) / product.price) * 100);
}
