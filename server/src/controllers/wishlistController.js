import User from "../models/User.js";
import Product from "../models/Product.js";

export const getWishlist = async (req, res) => {
  const user = await User.findById(req.user._id).populate(
    "wishlist",
    "name slug price discountPrice images stock colors sizes"
  );
  res.json({ products: user.wishlist.filter(Boolean) });
};

export const wishlistIds = (req, res) =>
  res.json({ ids: (req.user.wishlist || []).map(String) });

export const addToWishlist = async (req, res) => {
  if (!(await Product.exists({ _id: req.params.productId })))
    return res.status(404).json({ message: "Product not found" });
  await User.updateOne({ _id: req.user._id }, { $addToSet: { wishlist: req.params.productId } });
  res.json({ message: "Added" });
};

export const removeFromWishlist = async (req, res) => {
  await User.updateOne({ _id: req.user._id }, { $pull: { wishlist: req.params.productId } });
  res.json({ message: "Removed" });
};