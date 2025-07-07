import mongoose, { Schema, Document, Types } from "mongoose";

export type ProductVariationType = 'weight' | 'size' | 'none';

export interface ProductVariation {
  label: string;
  price: number;
}

export interface Product extends Document {
  name: string;
  description?: string;
  images: string[];
  category: Types.ObjectId; // Reference to Category
  variationType: ProductVariationType;
  variations: ProductVariation[];
  basePrice?: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProductVariationSchema: Schema<ProductVariation> = new Schema<ProductVariation>({
  label: { type: String, required: true },
  price: { type: Number, required: true }
}, { _id: false });

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
  variations: {
    type: [ProductVariationSchema],
    validate: {
      validator: function (value: ProductVariation[]) {
        if (this.variationType === 'none') {
          return value.length === 0;
        }
        return value.length > 0;
      },
      message: 'Variations must match variationType.'
    }
  },
  basePrice: {
    type: Number,
    required: function () {
      return this.variationType === 'none';
    }
  },
  createdAt: { type: Date, default: Date.now, immutable: true },
  updatedAt: { type: Date, default: Date.now }
});

const ProductModel = mongoose.model<Product>('products', ProductSchema);

export interface Category extends Document {
  name: string;
  description?: string;
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




export default ProductModel;
export { CategoryModel };
