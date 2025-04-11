import { Types } from "mongoose";

interface BlogContentInput {
  contentType: string;
  sequence: number;
  contentData: string;
}

interface CreateBlogInput {
  title: string;
  createdBy: Types.ObjectId;
  content: BlogContentInput[];
  coverImage: string;
}

interface UpdateBlogInput {
  title?: string;
  updatedBy?: Types.ObjectId;
  content?: BlogContentInput[];
}

export type { CreateBlogInput, UpdateBlogInput, BlogContentInput };
