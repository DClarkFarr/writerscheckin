const hashString = (value: string): number => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

export const deriveAvatarColor = (name: string): string => {
  const hash = hashString(name.trim().toLowerCase());
  const hue = hash % 360;
  const saturation = 56;
  const lightness = 48;
  return `hsl(${hue} ${saturation}% ${lightness}%)`;
};
