import mongoose, { Schema, Document, Types } from "mongoose";

export interface Category extends Document {
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
const CategorySchema: Schema<Category> = new Schema<Category>({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String
  },
  isActive: {
    type: Boolean,
    required: false,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});
const CategoryModel = mongoose.model<Category>('categories', CategorySchema);



export type ProductVariationType = 'weight' | 'size' | 'none';
export interface ProductVariation extends Document {
  productId: mongoose.Types.ObjectId; // Reference to Product
  label: string;
  price: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
const ProductVariationSchema: Schema<ProductVariation> = new Schema<ProductVariation>({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'products',
    required: true
  },
  label: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  isActive: {
    type: Boolean,
    required: false,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});
const ProductVariationModel = mongoose.model<ProductVariation>('productvariations', ProductVariationSchema);

export interface Product extends Document {
  name: string;
  description?: string;
  images: string[];
  category: Types.ObjectId; // Reference to Category
  variationType: ProductVariationType;
  basePrice?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
const ProductSchema: Schema<Product> = new Schema<Product>({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  images: [{ type: String }],
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'categories',
    required: true
  },
  variationType: {
    type: String,
    enum: ['weight', 'size', 'none'],
    required: true,
    default: 'none'
  },
  basePrice: {
    type: Number,
    required: function () {
      return this.variationType === 'none';
    }
  },
  isActive: {
    type: Boolean,
    required: false,
    default: true,
  },
  createdAt: { type: Date, default: Date.now, immutable: true },
  updatedAt: { type: Date, default: Date.now }
});

const ProductModel = mongoose.model<Product>('products', ProductSchema);

export default ProductModel;
export { CategoryModel, ProductVariationModel };
