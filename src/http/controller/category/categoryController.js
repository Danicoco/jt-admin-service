const Category = require("../../../models/category");
const { jsonS, jsonFailed } = require("../../../utils");
const { v4: uuidv4 } = require("uuid");

const Controller = {
  listCategories: async (req, res) => {
    try {
      const categories = await Category.find();
      return jsonS(res, 200, 'Categories fetched', categories);
    } catch (err) {
      console.error('Error listing categories:', err);
      return jsonFailed(res, {}, 'Internal Server Error', 500);
    }
  },

  getCategory: async (req, res) => {
    try {
      const { id } = req.params;
      const category = await Category.findById(id);
      if (!category) {
        return jsonFailed(res, {}, 'Category not found', 404);
      }
      return jsonS(res, 200, 'Category fetched', category);
    } catch (err) {
      console.error('Error fetching category:', err);
      return jsonFailed(res, {}, 'Internal Server Error', 500);
    }
  },

  createCategory: async (req, res) => {
    try {
      const { name, description, subcategory } = req.body;
      if (!name) {
        return jsonFailed(res, {}, 'Category name is required', 400);
      }

      const imageUrls = req.body.imageUrls || [];

      let subs = [];
      if (subcategory) {
        subs = Array.isArray(subcategory)
          ? subcategory
          : (typeof subcategory === 'string'
              ? JSON.parse(subcategory)
              : []);
      }

      const category = await Category.create({
        name:         name.trim(),
        description:  description || null,
        image:        imageUrls,
        subcategory:  subs,
      });

      return jsonS(res, 201, 'Category created', category);
    } catch (err) {
      console.error('Error creating category:', err);
      const status =
        err.name === 'ValidationError' || err.code === 11000
          ? 400
          : 500;
      const message =
        err.code === 11000
          ? 'Category name must be unique'
          : err.message || 'Internal Server Error';
      return jsonFailed(res, {}, message, status);
    }
  },

  updateCategory: async (req, res) => {
    try {
      const { id } = req.params;
      const category = await Category.findById(id);
      if (!category) {
        return jsonFailed(res, {}, 'Category not found', 404);
      }

      const { name, description, image, subcategory } = req.body;

      if (name !== undefined) {
        category.name = name.trim();
      }
      if (description !== undefined) {
        category.description = description;
      }
      if (req.body.imageUrls) {
        if (!Array.isArray(req.body.imageUrls)) {
          return jsonFailed(res, {}, 'imageUrls must be an array', 400);
      }
        category.imageUrls = req.body.imageUrls;
      }
      if (subcategory !== undefined) {
        category.subcategory = Array.isArray(subcategory)
          ? subcategory
          : (typeof subcategory === 'string'
              ? JSON.parse(subcategory)
              : []);
      }

      await category.save();
      return jsonS(res, 200, 'Category updated', category);
    } catch (err) {
      console.error('Error updating category:', err);
      const status = err.name === 'ValidationError' ? 400 : 500;
      return jsonFailed(res, {}, err.message || 'Internal Server Error', status);
    }
  },

  deleteCategory: async (req, res) => {
    try {
      const { id } = req.params;
      const category = await Category.findByIdAndDelete(id);
      if (!category) {
        return jsonFailed(res, {}, 'Category not found', 404);
      }
      return jsonS(res, 200, 'Category deleted', category);
    } catch (err) {
      console.error('Error deleting category:', err);
      return jsonFailed(res, {}, 'Internal Server Error', 500);
    }
  },
};

module.exports = Controller;
