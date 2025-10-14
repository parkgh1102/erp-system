"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ProductController_1 = require("../controllers/ProductController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticateToken);
router.post('/business/:businessId/products', ProductController_1.ProductController.create);
router.get('/business/:businessId/products', ProductController_1.ProductController.getAll);
router.get('/business/:businessId/products/:id', ProductController_1.ProductController.getById);
router.put('/business/:businessId/products/:id', ProductController_1.ProductController.update);
router.delete('/business/:businessId/products/:id', ProductController_1.ProductController.delete);
exports.default = router;
//# sourceMappingURL=productRoutes.js.map