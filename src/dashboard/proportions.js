export const defaultProportions = { width: 100, height: 100 };
export function validProportions(value) {
  return value != null && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).every(key => key === 'width' || key === 'height') && ['width', 'height'].every(key => Number.isInteger(value[key]) && value[key] >= 80 && value[key] <= 120);
}
export function proportionTransform(value = defaultProportions) {
  if (!validProportions(value)) throw new Error('Le proporzioni devono essere comprese tra 80% e 120%.');
  return `translate(340 342) scale(${value.width / 100} ${value.height / 100}) translate(-340 -342)`;
}
