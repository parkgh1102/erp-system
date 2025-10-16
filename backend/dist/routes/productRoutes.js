"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ProductController_1 = require("../controllers/ProductController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticateToken);
router.post('/businesses/:businessId/products', ProductController_1.ProductController.create);
router.get('/businesses/:businessId/products', ProductController_1.ProductController.getAll);
router.get('/businesses/:businessId/products/:id', ProductController_1.ProductController.getById);
router.put('/businesses/:businessId/products/:id', ProductController_1.ProductController.update);
router.delete('/businesses/:businessId/products/:id', ProductController_1.ProductController.delete);
exports.default = router;
//# sourceMappingURL=productRoutes.js.map