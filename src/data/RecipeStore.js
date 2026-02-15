let currentIngredients = [];
let recipeMetadata = { title: "", prepTime: "", cookTime: "", tags: ["Maintien"], image: null, currentStep: 1, editingId: null };

export const RecipeStore = {
  getIngredients: () => [...currentIngredients],
  addIngredient: (ingredient) => {
    const safeIngredient = { ...ingredient, _localId: Date.now().toString() + Math.random().toString() };
    currentIngredients.push(safeIngredient);
  },
  updateIngredient: (index, ingredient) => {
     const originalId = currentIngredients[index]._localId;
     currentIngredients[index] = { ...ingredient, _localId: originalId };
  },
  removeIngredient: (index) => { currentIngredients.splice(index, 1); },
  getDishName: () => recipeMetadata.title,
  setDishName: (name) => { recipeMetadata.title = name; },
  getMetadata: () => ({ ...recipeMetadata }),
  updateMetadata: (updates) => { recipeMetadata = { ...recipeMetadata, ...updates }; },
  clear: () => {
    currentIngredients = [];
    recipeMetadata = { title: "", prepTime: "", cookTime: "", tags: ["Maintien"], image: null, currentStep: 1, editingId: null };
  }
};