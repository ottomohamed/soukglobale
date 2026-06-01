export const DEVELOPING_COUNTRIES = [
  "Morocco", "Egypt"
];

export const DEVELOPED_COUNTRIES = [
  "France", "USA", "Germany", "UK", "Switzerland", 
  "Canada", "Australia", "Japan", "Netherlands", "Belgium", 
  "Sweden", "Norway", "Denmark", "Austria", "New Zealand", "Singapore"
];

export const CRAFT_CATEGORIES = [
  "Pottery", "Weaving", "Leather", "Jewelry", "Woodwork", 
  "Embroidery", "Metalwork", "Ceramics", "Carpets"
];

export function getYoutubeVideoId(url?: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}
