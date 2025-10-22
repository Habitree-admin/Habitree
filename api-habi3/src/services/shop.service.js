const db = require("../../../util/database");
const AWS = require('aws-sdk');

// aws sdk setup
const AWS_BUCKET = process.env.AWS_BUCKET;
const AWS_REGION = process.env.AWS_REGION;
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;

AWS.config.update({
  signatureVersion: 'v4',
  region: AWS_REGION,
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY
});

const s3 = new AWS.S3();

/**
 * This function gets all shop items with purchase status for a user
 * 
 * getShopItemsForUser returns all items with signed URLs for images and purchase status per user
 */
exports.getShopItemsForUser = async (id) => {
  const query = `
    SELECT s.IDItem, s.name, s.state, s.category, s.price, s.image_name,
           CASE WHEN us.IDUserShop IS NOT NULL THEN 1 ELSE 0 END AS alreadyPurchased
    FROM shop s
    LEFT JOIN userShop us 
           ON s.IDItem = us.IDItem 
          AND us.IDUser = ?
    WHERE s.state = 1
  `;
  
  const [rows] = await db.execute(query, [id]);

  // add signedUrls to items to consume them in the mobile application
  const itemsWithUrls = await Promise.all(
    rows.map(async (item) => {
      if (!item.image_name) return { ...item, imageUrl: null };

      const params = { Bucket: AWS_BUCKET, Key: item.image_name, Expires: 3600 };
      const signedUrl = s3.getSignedUrl('getObject', params);
      return { ...item, imageUrl: signedUrl };
    })
  );

  return itemsWithUrls;
};

/**
 * This function buys an item to a user and adds it to the users inventory
 * 
 * buyShopItemForUser adds item to the user inventory and also does error handling
 */
exports.buyShopItemForUser = async (IDUser, IDItem) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Check if item is already purchased
    const [existingPurchase] = await connection.execute(
      "SELECT IDUserShop FROM userShop WHERE IDUser = ? AND IDItem = ?",
      [IDUser, IDItem]
    );

    if (existingPurchase.length > 0) {
      throw new Error("Item already purchased");
    }

    // Get item price
    const [itemRows] = await connection.execute(
      "SELECT price FROM shop WHERE IDItem = ?",
      [IDItem]
    );

    if (itemRows.length === 0) throw new Error("Item not found");

    const price = itemRows[0].price;

    // Check if user has enough coins
    const [userRows] = await connection.execute(
      "SELECT coins FROM user WHERE IDUser = ?",
      [IDUser]
    );

    if (userRows.length === 0) throw new Error("User not found");

    const userCoins = userRows[0].coins;
    if (userCoins < price) throw new Error("Not enough coins");

    // Update user coins
    await connection.execute(
      "UPDATE user SET coins = coins - ? WHERE IDUser = ?",
      [price, IDUser]
    );

    // Register purchase in userShop
    const [purchaseResult] = await connection.execute(
      `INSERT INTO userShop (IDUser, IDItem, transaction, purchaseAmount, pointsEarned, purchaseDate)
       VALUES (?, ?, UUID(), 1, 1, NOW())`,
      [IDUser, IDItem]
    );

    // Add item to inventory
    await connection.execute(
      `INSERT INTO inventory (IDUser, IDItem, Quantity, status)
       VALUES (?, ?, 1, 0)`,
      [IDUser, IDItem]
    );

    await connection.commit();

    return {
      IDUserShop: purchaseResult.insertId,
      message: "Purchase completed successfully"
    };
  } catch (error) {
    await connection.rollback();
    console.error("Error in buyShopItemForUser:", error);
    throw error;
  } finally {
    connection.release();
  }
};