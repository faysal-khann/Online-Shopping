import mongoose from "mongoose";
import Review from "../models/Review.js";
import Order from "../models/Order.js";

export const myReviews = async (req, res) => {
  const reviews = await Review.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .populate("product", "name slug images")
    .lean();
  res.json({ reviews });
};

export const productReviews = async (req, res) => {
  const id = new mongoose.Types.ObjectId(req.params.productId);
  const [reviews, [agg]] = await Promise.all([
    Review.find({ product: id }).sort({ createdAt: -1 }).limit(50).populate("user", "name").lean(),
    Review.aggregate([
      { $match: { product: id } },
      { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]),
  ]);
  res.json({
    average: agg ? Math.round(agg.avg * 10) / 10 : 0,
    count: agg?.count || 0,
    reviews: reviews.map((r) => ({
      _id: r._id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      userName: r.user?.name ?? "Customer",
    })),
  });
};

// Only buyers whose order was delivered can review that product, once
export const createReview = async (req, res) => {
  const { orderId, productId, rating, comment = "" } = req.body;
  const stars = Number(rating);
  if (!Number.isInteger(stars) || stars < 1 || stars > 5)
    return res.status(400).json({ message: "Choose a rating from 1 to 5" });
  if (typeof comment !== "string" || comment.length > 1000)
    return res.status(400).json({ message: "Comment is too long" });

  const order = await Order.findOne({
    _id: orderId,
    user: req.user._id,
    status: "delivered",
    "items.product": productId,
  });
  if (!order)
    return res.status(403).json({ message: "You can only review products from delivered orders" });
  if (await Review.exists({ user: req.user._id, product: productId }))
    return res.status(409).json({ message: "You already reviewed this product" });

  const review = await Review.create({
    user: req.user._id,
    product: productId,
    order: order._id,
    rating: stars,
    comment: comment.trim(),
  });
  res.status(201).json({ review });
};