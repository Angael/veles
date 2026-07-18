export function getValidRecipeImageIndex(index: number, imageCount: number) {
  return Number.isInteger(index) && index >= 0 && index < imageCount ? index : 0;
}
