const express = require("express");
const { CategoryController } = require("../../http/controller/category");
const auth = require("../../middlewares/ambassadorAuth/authMiddleware");
const { cloudConfig, cloudinaryUploadMultiple } = require("../../services/cloudinaryService");

const router = express.Router();

router.get('/categories', CategoryController.listCategories);
router.get('/categories/:id', CategoryController.getCategory);
router.post('/categories', auth, cloudConfig, cloudinaryUploadMultiple, CategoryController.createCategory);
router.patch('/categories/:id', auth, CategoryController.updateCategory);
router.delete('/categories/:id', auth, CategoryController.deleteCategory);

module.exports = {
    baseUrl: "/admin",
    router,
}