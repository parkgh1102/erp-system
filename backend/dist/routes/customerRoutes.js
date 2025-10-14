"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const CustomerController_1 = require("../controllers/CustomerController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticateToken);
router.post('/businesses/:businessId/customers', CustomerController_1.CustomerController.create);
router.get('/businesses/:businessId/customers', CustomerController_1.CustomerController.getAll);
router.get('/businesses/:businessId/customers/:id', CustomerController_1.CustomerController.getById);
router.put('/businesses/:businessId/customers/:id', CustomerController_1.CustomerController.update);
router.delete('/businesses/:businessId/customers/:id', CustomerController_1.CustomerController.delete);
exports.default = router;
//# sourceMappingURL=customerRoutes.js.map