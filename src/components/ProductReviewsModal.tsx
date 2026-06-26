import React, { useState, useEffect } from 'react';
import { Star, X } from 'lucide-react';
import { Product, Review } from '../types';
import { getProductReviews, createReview } from '../data/adminStore';

interface ProductReviewsModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onReviewSubmitted: () => void;
}

const ProductReviewsModal: React.FC<ProductReviewsModalProps> = ({ product, isOpen, onClose, onReviewSubmitted }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadReviews();
    }
  }, [isOpen, product.id]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const data = await getProductReviews(product.id);
      setReviews(data);
    } catch (err) {
      console.error('Failed to load reviews', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await createReview(product.id, rating, comment);
      setComment('');
      setRating(5);
      await loadReviews();
      onReviewSubmitted();
    } catch (err) {
      console.error('Failed to submit review', err);
      alert('Failed to submit review. Check console for details.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
          <h2 className="text-xl font-bold text-gray-800">Reviews for {product.name}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Write Review Section */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-3">Write a Review</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Rating</label>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Comment (Optional)</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none h-20"
                  placeholder="Share your experience with this product..."
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-green-600 text-white font-semibold py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          </div>

          {/* Reviews List */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-4 border-b pb-2">Customer Reviews</h3>
            {loading ? (
              <p className="text-gray-500 text-center py-4">Loading reviews...</p>
            ) : reviews.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No reviews yet. Be the first to review!</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b border-gray-100 pb-4 last:border-0">
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 font-medium mb-1">
                      By {review.customer?.name || 'Customer'}
                    </div>
                    {review.comment && (
                      <p className="text-sm text-gray-700 mt-1">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductReviewsModal;
