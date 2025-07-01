export const hexToRgba = (hex, alpha = 1) => {
  const cleanHex = hex.charAt(0) === '#' ? hex : '#' + hex;
  
  const r = parseInt(cleanHex.slice(1, 3), 16);
  const g = parseInt(cleanHex.slice(3, 5), 16);
  const b = parseInt(cleanHex.slice(5, 7), 16);
  
  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    console.warn('Geçersiz hex renk kodu:', hex);
    return 'rgba(0, 0, 0, ' + alpha + ')';
  }
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}; 