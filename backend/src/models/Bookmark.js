import mongoose from 'mongoose';

const bookmarkSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
    },
    itemType: {
      type: String,
      required: [true, 'Item type is required'],
      enum: {
        values: ['company', 'coding_problem', 'study_material', 'mock_test'],
        message: 'Invalid bookmark item type',
      },
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Item ID is required'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

// Compound unique index to strictly prevent duplicate bookmarks for the same item per user
bookmarkSchema.index({ user: 1, itemType: 1, itemId: 1 }, { unique: true });
bookmarkSchema.index({ user: 1, itemType: 1, createdAt: -1 });

const Bookmark = mongoose.model('Bookmark', bookmarkSchema);

export default Bookmark;
