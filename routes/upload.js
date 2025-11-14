const express = require("express");
const router = express.Router();
const cloudinary = require("../config/cloudinary");

// This route gives frontend a signed upload signature
router.post("/get-signature", (req, res) => {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      { timestamp },
      cloudinary.config().api_secret
    );

    res.json({
      timestamp,
      signature,
      cloudName: cloudinary.config().cloud_name,
      apiKey: cloudinary.config().api_key,
    });
  } catch (err) {
    console.error("Signature error:", err);
    res.status(500).json({ message: "Failed to get signature" });
  }
});

module.exports = router;
