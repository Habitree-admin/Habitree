const express = require("express")
const router = express.Router()
const isAuth = require('../../util/is-auth');
const shopController = require("../../controllers/shop/shop.controller")

router.get("/api/filter-options", isAuth, shopController.getFilterOptions);
router.get("/api/filter", isAuth, shopController.filterItems);

router.get("/", isAuth, shopController.getItems);

router.post("/", isAuth, shopController.postItem)

router.get("/get_bucket_file/:file", shopController.getBucketFile )

router.get("/get_bucket_url/:file", shopController.getBucketFileUrl )

/**
 * 
 * Serves the edit view for an item (or JSON for AJAX) by id.
 * Used to prefill the form, including a signed image preview URL.
 *
 */
router.get("/edit/:id", isAuth, shopController.editItem);

/**
 * 
 * Updates an item by id.
 * Normalizes inputs and persists changes, responding with JSON or redirect.
 *
 */
router.post("/update/:id", isAuth, shopController.postUpdateItem);
//router.get('/edit/:id', shopController.getEditItemModal);

router.post('/toggle', shopController.toggleItemState);

module.exports = router
