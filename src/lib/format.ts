export function formatPrice(price: number | null): string {
  if (price == null) return '';
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    maximumFractionDigits: price % 1 === 0 ? 0 : 2,
  }).format(price);
}

export function childAge(birthDate: string | null): string {
  if (!birthDate) return '';
  const birth = new Date(birthDate);
  const now = new Date();
  let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (now.getDate() < birth.getDate()) months -= 1;
  if (months < 0) return '';
  if (months < 24) return `${months} חודשים`;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return rest >= 6 ? `${years} וחצי` : `${years} שנים`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric', year: 'numeric' });
}
