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

router.get("/edit/:id", isAuth, shopController.editItem);

router.post("/update/:id", isAuth, shopController.postUpdateItem);
//router.get('/edit/:id', shopController.getEditItemModal);

router.post('/toggle', shopController.toggleItemState);

module.exports = router


