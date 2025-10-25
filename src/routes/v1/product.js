const express = require("express");
const auth = require("../../middlewares/ambassadorAuth/authMiddleware");
const { ProductController } = require("../../http/controller/product");
const { cloudConfig, cloudinaryUploadMultiple } = require("../../services/cloudinaryService") 

const router = express.Router();

router.post("/add/product", auth, cloudConfig, cloudinaryUploadMultiple, ProductController.createProduct);
router.get("/products", ProductController.listProducts);
router.get("/products/:id/clicks", ProductController.getProductClicksCount);
router.patch("/products/:id", auth, cloudConfig, cloudinaryUploadMultiple, ProductController.updateProduct);
router.delete("/products/:id", auth, ProductController.deleteProduct);
router.get('/products/insights/series', auth, ProductController.series);
router.get('/products/insights/top-product', auth, ProductController.topProduct);
router.get('/products/insights/sold-out', auth, ProductController.soldOutProduct);
router.get('/products/insights', auth, ProductController.allData);
router.get("/products/:id", ProductController.getProduct);

module.exports = {
    baseUrl: "/admin",
    router,
}