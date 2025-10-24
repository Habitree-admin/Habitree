/**
 * Returns item data for edit as JSON (AJAX) or renders the edit page.
 * Also generates a signed URL to preview the current image.
 *
 */
exports.editItem = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await Item.fetchById(id);

    if (!rows || rows.length === 0) {
      if (req.accepts('json')) {
        return res.status(404).json({ success: false, message: "Item not found" });
      }
      return res.status(404).send("Item not found");
    }

    const item = rows[0];

    // If the client requests JSON (AJAX from the modal), return the data
    if (req.accepts('json')) {
      // Generate a signed URL to preview the current image
      const params = { Bucket: AWS_BUCKET, Key: item.image_name, Expires: 3600 };
      const imageUrl = s3.getSignedUrl('getObject', params);

      return res.json({
        success: true,
        data: {
          id: item.IDItem,
          name: item.name,
          state: String(item.state),
          category: item.category,
          price: item.price,
          image_name: item.image_name,
          imageUrl
        }
      });
    }

    // If accessed directly via browser, render the traditional view
    res.render('editItem', {
      id: item.IDItem,
      name: item.name,
      state: item.state,
      category: item.category,
      price: item.price,
      image_name: item.image_name,
      csrfToken: req.csrfToken()
    });
  } catch (error) {
    console.error(error);
    if (req.accepts('json')) {
      return res.status(500).json({ success: false, message: "Error loading item data" });
    }
    res.status(500).send("Error loading item data");
  }
};


/**
 * Updates an existing item by id, optionally replacing its image in S3.
 * Normalizes inputs, updates the DB, and responds with JSON or redirect.
 *
 */
exports.postUpdateItem = async (req, res) => {
  const { id } = req.params;
  console.log('[UPDATE] params.id =', id);

  if (!id) {
    const msg = 'Missing item id in URL (/shop/update/:id)';
    console.error('[UPDATE] 400:', msg);
    return res.status(400).json({ success: false, msg });
  }

  const uploadMiddleware = upload.array('file', 1);

  uploadMiddleware(req, res, async function (err) {
    if (err) {
      console.error("❌ Error en multer (update):", err);
      return res.status(400).json({ success: false, msg: "Error uploading file." });
    }

    try {
      const safeId = Number(id);

      // Fetch the current record (for validation/log; we no longer rely on hidden fields)
      const [rows] = await Item.fetchById(safeId);
      if (!rows || rows.length === 0) {
        return res.status(404).json({ success: false, msg: 'Item not found' });
      }
      const current = rows[0];

      const { name, state, category, price } = req.body;
      console.log('[UPDATE] raw body =', { name, state, category, price });

      // Normalize types
      const safeName = (name ?? current.name ?? '').toString().trim();
      const safeCategory = (category ?? current.category ?? '').toString().trim();
      const safeState = (state === undefined || state === null || state === '')
        ? (Number(current.state) === 1 ? 1 : 0)
        : (String(state) === '1' ? 1 : 0);

      let safePrice;
      if (price === undefined || price === null || String(price).trim() === '') {
        safePrice = Number(current.price);
      } else {
        const n = Number(price);
        if (Number.isNaN(n)) throw new Error('Invalid price');
        safePrice = n;
      }

      // If a new file was uploaded, replace the image in S3 and update image_name
      if (req.files && req.files.length > 0) {
        const filePath = path.join(__dirname, '../../bucket', req.files[0].filename);
        const fileName = req.files[0].filename;
        const fileData = fs.readFileSync(filePath);

        const params = { Bucket: AWS_BUCKET, Key: fileName, Body: fileData };
        const s3Result = await s3.upload(params).promise();
        console.log(`Nueva imagen subida a S3: ${s3Result.Location}`);

        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr) console.error("No se pudo borrar archivo local:", unlinkErr);
        });

        const [result] = await Item.update(safeId, {
          name: safeName,
          state: safeState,
          category: safeCategory,
          price: safePrice,
          image_name: fileName
        });
        console.log('[UPDATE] DB result (with image) =', result);
      } else {
        // Keep the current image_name; only update other fields
        const [result] = await Item.updateWithoutImage(safeId, {
          name: safeName,
          state: safeState,
          category: safeCategory,
          price: safePrice
        });
        console.log('[UPDATE] DB result (without image) =', result);
      }

      if (req.accepts('json')) {
        return res.json({ success: true, redirect: '/shop' });
      }
      return res.redirect('/shop');
    } catch (error) {
      console.error("Error updating item:", error);
      if (req.accepts('json')) {
        return res.status(500).json({ success: false, msg: error.message || "Error updating item" });
      }
      res.status(500).send("Error updating item");
    }
  });
};
