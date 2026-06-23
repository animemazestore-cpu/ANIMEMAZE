import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Star, ShieldAlert, Sparkles, ChevronRight, ThumbsUp, Plus, HelpCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Product, Review, ProductQuestion } from '../types/database';
import { sanitizeSlug } from '../lib/persistence';
import { useAuthStore } from '../store/useAuthStore';
import { useCartStore } from '../store/useCartStore';
import { useWishlistStore } from '../store/useWishlistStore';
import { Button } from '../components/common/Button';

export const ProductDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const { addItem } = useCartStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [questions, setQuestions] = useState<ProductQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [qnaLoading, setQnaLoading] = useState(false);

  // Review Form States
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewImages, setReviewImages] = useState<File[]>([]);
  const [reviewSort, setReviewSort] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');
  
  // Q&A Form States
  const [newQuestion, setNewQuestion] = useState('');

  const [activeImage, setActiveImage] = useState('');
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [userCanReview, setUserCanReview] = useState(false);

  // Review Filters / Sorting
  const [ratingFilter, setRatingFilter] = useState<number | 'All'>('All');

  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!slug) return;
      try {
        setLoading(true);
        
        // Fetch product from Supabase
        let dbProduct = null;
        try {
          const { data: exactMatch } = await supabase
            .from('products')
            .select(`
              *,
              category:categories (*)
            `)
            .eq('slug', slug)
            .maybeSingle();
          
          if (exactMatch) {
            dbProduct = exactMatch;
          } else {
            const { data: allProds } = await supabase
              .from('products')
              .select(`
                *,
                category:categories (*)
              `);
            if (allProds) {
              dbProduct = allProds.find(p => sanitizeSlug(p.slug, p.name) === slug) || null;
            }
          }
        } catch (dbErr) {
          console.warn('Supabase query failed.', dbErr);
        }

        if (!dbProduct) {
          setProduct(null);
          setRelatedProducts([]);
        } else {
          const parsedProduct = {
            ...dbProduct,
            price: Number(dbProduct.price),
            slug: sanitizeSlug(dbProduct.slug, dbProduct.name)
          } as Product;
          setProduct(parsedProduct);
          setActiveImage(parsedProduct.main_image_url);

          // Fetch related products
          try {
            const { data: dbRelated } = await supabase
              .from('products')
              .select('*')
              .eq('category_id', parsedProduct.category_id)
              .neq('id', parsedProduct.id)
              .limit(4);
            
            if (dbRelated) {
              setRelatedProducts(dbRelated.map(p => ({
                ...p,
                price: Number(p.price),
                slug: sanitizeSlug(p.slug, p.name)
              })) as Product[]);
            } else {
              setRelatedProducts([]);
            }
          } catch (relErr) {
            console.warn('Could not fetch related products from Supabase:', relErr);
            setRelatedProducts([]);
          }
        }
      } catch (err) {
        console.error('Error fetching product details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [slug]);

  // Fetch Reviews & Q&A
  useEffect(() => {
    if (!product) return;

    const fetchReviewsAndQuestions = async () => {
      try {
        // Fetch reviews from Supabase
        const { data: dbReviews, error: revError } = await supabase
          .from('reviews')
          .select('*')
          .eq('product_id', product.id)
          .eq('status', 'APPROVED');

        if (revError) throw revError;

        const dbReviewsList = dbReviews ? dbReviews.map((r: any) => ({
          ...r,
          review_images: Array.isArray(r.review_images) ? r.review_images : []
        })) : [];

        // Hydrate likes
        const localLikes = JSON.parse(localStorage.getItem('animemaze_local_review_likes') || '[]');
        const userLikedReviewIds = new Set(localLikes.filter((l: any) => l.user_id === user?.id).map((l: any) => l.review_id));
        const likeCountsMap: { [key: string]: number } = {};
        localLikes.forEach((l: any) => {
          likeCountsMap[l.review_id] = (likeCountsMap[l.review_id] || 0) + 1;
        });

        const reviewsWithLikes = dbReviewsList.map((r: any) => ({
          ...r,
          likes_count: (r.likes_count || 0) + (likeCountsMap[r.id] || 0),
          is_liked_by_user: user ? userLikedReviewIds.has(r.id) : false
        }));
        setReviews(reviewsWithLikes);

        // Fetch questions
        const { data: dbQuestions, error: qnaError } = await supabase
          .from('product_questions')
          .select('*')
          .eq('product_id', product.id)
          .order('created_at', { ascending: false });

        if (qnaError) throw qnaError;

        const questionsList = dbQuestions || [];
        setQuestions(questionsList as ProductQuestion[]);

        // Verify if user purchased this product (DB only)
        if (user) {
          let verified = false;
          try {
            const { data: userOrders } = await supabase
              .from('orders')
              .select(`id, status, order_items!inner(product_id)`)
              .eq('user_id', user.id)
              .eq('order_items.product_id', product.id);
            if (userOrders && userOrders.length > 0) verified = true;
          } catch (_) {}
          setUserCanReview(verified);
        }
      } catch (err) {
        console.error('Error fetching reviews or Q&As from DB:', err);
        setReviews([]);
        setQuestions([]);
        setUserCanReview(false);
      }
    };

    fetchReviewsAndQuestions();
  }, [product, user]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <ShieldAlert className="h-12 w-12 text-danger mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h2>
        <p className="text-gray-600 mb-6">The product you are looking for does not exist or has been removed.</p>
        <Link to="/shop">
          <Button>Back to Shop</Button>
        </Link>
      </div>
    );
  }

  // Calculate Average Rating
  const averageRating = reviews.length > 0
    ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1))
    : 0;

  // Rating count distribution
  const ratingCounts = [0, 0, 0, 0, 0]; // Index 0 = 1 star, Index 4 = 5 stars
  reviews.forEach(r => {
    if (r.rating >= 1 && r.rating <= 5) {
      ratingCounts[r.rating - 1]++;
    }
  });

  const getRatingPercentage = (stars: number) => {
    if (reviews.length === 0) return 0;
    return Math.round((ratingCounts[stars - 1] / reviews.length) * 100);
  };

  // Image Upload handler for Reviews
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      if (filesArray.length + reviewImages.length > 5) {
        alert("You can upload a maximum of 5 images.");
        return;
      }
      setReviewImages([...reviewImages, ...filesArray]);
    }
  };

  const removeReviewImage = (index: number) => {
    setReviewImages(reviewImages.filter((_, idx) => idx !== index));
  };

  // Submit Review — always try Supabase first, localStorage fallback
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    if (!reviewText.trim()) return;

    setReviewLoading(true);
    try {
      const uploadedUrls: string[] = [];

      // Try uploading images to Supabase storage
      for (const file of reviewImages) {
        try {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `${user.id}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('review-images')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('review-images')
            .getPublicUrl(filePath);

          uploadedUrls.push(publicUrl);
        } catch (uploadErr) {
          console.warn('Image upload failed, using object URL instead:', uploadErr);
          uploadedUrls.push(URL.createObjectURL(file));
        }
      }

      const reviewPayload = {
        product_id: product.id,
        user_id: user.id,
        user_name: profile.full_name || 'Anonymous User',
        rating: reviewRating,
        review_text: reviewText.trim(),
        review_images: uploadedUrls,
        verified_purchase: userCanReview,
        status: 'APPROVED'
      };

      // Always try Supabase
      const { data: insertedReview, error: reviewError } = await supabase
        .from('reviews')
        .insert(reviewPayload)
        .select()
        .single();

      if (reviewError) throw reviewError;

      if (insertedReview) {
        setReviews([insertedReview as Review, ...reviews]);
        setReviewText('');
        setReviewImages([]);
        setReviewRating(5);
        alert('Review posted successfully!');
      }
    } catch (err: any) {
      console.error('Error submitting review:', err);
      alert(err.message || 'Failed to post review. Please try again.');
    } finally {
      setReviewLoading(false);
    }
  };

  // Submit Question — always try Supabase
  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!newQuestion.trim()) return;

    setQnaLoading(true);
    try {
      const { data: questionData, error } = await supabase
        .from('product_questions')
        .insert({
          product_id: product.id,
          user_id: user.id,
          question: newQuestion.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      if (questionData) {
        setQuestions([questionData as ProductQuestion, ...questions]);
        setNewQuestion('');
        alert('Question submitted successfully!');
      }
    } catch (err: any) {
      console.error('Error submitting question:', err);
      alert(err.message || 'Failed to submit question.');
    } finally {
      setQnaLoading(false);
    }
  };

  const handleLikeReview = async (reviewId: string) => {
    if (!user) {
      alert("Please log in to like reviews.");
      return;
    }

    const isMock = localStorage.getItem('animemaze_mock_session') === 'true';
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id);
    const isLocalReview = reviewId.startsWith('rev-');

    if (isMock || !isUUID || isLocalReview) {
      // Toggle like locally in state and localStorage
      const localLikes = JSON.parse(localStorage.getItem('animemaze_local_review_likes') || '[]');
      const existingLikeIdx = localLikes.findIndex((l: any) => l.review_id === reviewId && l.user_id === user.id);

      if (existingLikeIdx > -1) {
        localLikes.splice(existingLikeIdx, 1);
        localStorage.setItem('animemaze_local_review_likes', JSON.stringify(localLikes));
        setReviews(reviews.map(r => {
          if (r.id === reviewId) {
            return {
              ...r,
              likes_count: Math.max(0, (r.likes_count || 0) - 1),
              is_liked_by_user: false
            };
          }
          return r;
        }));
      } else {
        localLikes.push({ review_id: reviewId, user_id: user.id });
        localStorage.setItem('animemaze_local_review_likes', JSON.stringify(localLikes));
        setReviews(reviews.map(r => {
          if (r.id === reviewId) {
            return {
              ...r,
              likes_count: (r.likes_count || 0) + 1,
              is_liked_by_user: true
            };
          }
          return r;
        }));
      }
      return;
    }

    try {
      // Toggle like in DB
      const { data: existingLike, error: selectErr } = await supabase
        .from('review_likes')
        .select('*')
        .eq('review_id', reviewId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (selectErr) throw selectErr;

      if (existingLike) {
        const { error: deleteErr } = await supabase
          .from('review_likes')
          .delete()
          .eq('review_id', reviewId)
          .eq('user_id', user.id);
        
        if (deleteErr) throw deleteErr;
        
        setReviews(reviews.map(r => {
          if (r.id === reviewId) {
            return {
              ...r,
              likes_count: Math.max(0, (r.likes_count || 0) - 1),
              is_liked_by_user: false
            };
          }
          return r;
        }));
      } else {
        const { error: insertErr } = await supabase
          .from('review_likes')
          .insert({ review_id: reviewId, user_id: user.id });

        if (insertErr) throw insertErr;

        setReviews(reviews.map(r => {
          if (r.id === reviewId) {
            return {
              ...r,
              likes_count: (r.likes_count || 0) + 1,
              is_liked_by_user: true
            };
          }
          return r;
        }));
      }
    } catch (err) {
      console.warn('Supabase review like toggle failed, toggling locally:', err);
      // Fallback local toggle
      const localLikes = JSON.parse(localStorage.getItem('animemaze_local_review_likes') || '[]');
      const existingLikeIdx = localLikes.findIndex((l: any) => l.review_id === reviewId && l.user_id === user.id);

      if (existingLikeIdx > -1) {
        localLikes.splice(existingLikeIdx, 1);
        localStorage.setItem('animemaze_local_review_likes', JSON.stringify(localLikes));
        setReviews(reviews.map(r => {
          if (r.id === reviewId) {
            return {
              ...r,
              likes_count: Math.max(0, (r.likes_count || 0) - 1),
              is_liked_by_user: false
            };
          }
          return r;
        }));
      } else {
        localLikes.push({ review_id: reviewId, user_id: user.id });
        localStorage.setItem('animemaze_local_review_likes', JSON.stringify(localLikes));
        setReviews(reviews.map(r => {
          if (r.id === reviewId) {
            return {
              ...r,
              likes_count: (r.likes_count || 0) + 1,
              is_liked_by_user: true
            };
          }
          return r;
        }));
      }
    }
  };

  // Filter & Sort reviews
  const displayedReviews = reviews
    .filter(r => ratingFilter === 'All' || r.rating === ratingFilter)
    .sort((a, b) => {
      if (reviewSort === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (reviewSort === 'highest') return b.rating - a.rating;
      if (reviewSort === 'lowest') return a.rating - b.rating;
      // newest
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const liked = user ? isInWishlist(product.id) : false;
  const isOutOfStock = product.stock <= 0;
  const isApparelOrMerch = product && (
    product.category_id === '2' || 
    /hoodie|shirt|t-shirt|apparel|clothing|jacket|sweater|jersey|socks|cap|merch/i.test(product.name || '') ||
    /hoodie|shirt|t-shirt|apparel|clothing|jacket|sweater|jersey|socks|cap|merch/i.test(product.description || '')
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12 space-y-12 sm:space-y-20">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-1.5 text-xs sm:text-sm text-gray-500">
        <Link to="/" className="hover:text-gray-900 transition-colors">Home</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link to="/shop" className="hover:text-gray-900 transition-colors">Shop</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-gray-600 truncate max-w-xs">{product.name}</span>
      </nav>
      {/* Main product display */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left Side: Images */}
        <div className="lg:col-span-5 flex flex-col space-y-3">
          <div className="aspect-square sm:aspect-[4/5] lg:aspect-square bg-gray-50 rounded-xl sm:rounded-2xl overflow-hidden border border-gray-200 relative lg:max-h-[440px]">
            <img
              src={activeImage}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          {/* Thumbnails */}
          {product.additional_images && product.additional_images.length > 0 && (
            <div className="flex space-x-2 overflow-x-auto pb-2">
              <button
                onClick={() => setActiveImage(product.main_image_url)}
                className={`w-14 h-14 sm:w-16 sm:h-16 bg-gray-100 rounded-lg sm:rounded-xl overflow-hidden border flex-shrink-0 transition-all ${
                  activeImage === product.main_image_url ? 'border-primary scale-95' : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <img src={product.main_image_url} alt="" className="w-full h-full object-cover" />
              </button>
              {product.additional_images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`w-14 h-14 sm:w-16 sm:h-16 bg-gray-100 rounded-lg sm:rounded-xl overflow-hidden border flex-shrink-0 transition-all ${
                    activeImage === img ? 'border-primary scale-95' : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Details & Add to Cart */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-2">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase">
              <Sparkles className="h-3 w-3" />
              <span>Premium Collection</span>
            </span>
            <h1 className="text-3xl font-extrabold text-gray-900 leading-tight">{product.name}</h1>
          </div>

          {/* Rating Summary */}
          {reviews.length > 0 && (
            <div className="flex items-center space-x-2.5">
              <div className="flex items-center text-yellow-500">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4.5 w-4.5 ${
                      i < Math.floor(averageRating) ? 'fill-current' : 'text-gray-600'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-semibold text-gray-900">{averageRating} out of 5</span>
              <span className="text-xs text-gray-500">({reviews.length} reviews)</span>
            </div>
          )}

          <div className="text-2xl font-extrabold text-gray-900">₹{product.price}</div>

          <p className="text-gray-600 text-sm leading-relaxed border-t border-b border-gray-200 py-4">
            {product.description}
          </p>

          {/* Stock state */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 font-medium">Availability:</span>
            {isOutOfStock ? (
              <span className="font-semibold text-danger bg-danger/10 border border-danger/20 px-2 py-0.5 rounded uppercase text-xs">
                Out of Stock
              </span>
            ) : product.stock <= 5 ? (
              <span className="font-semibold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded uppercase text-xs">
                Only {product.stock} left in stock!
              </span>
            ) : (
              <span className="font-semibold text-success bg-success/10 border border-success/20 px-2 py-0.5 rounded uppercase text-xs">
                In Stock ({product.stock} available)
              </span>
            )}
          </div>

          {/* Actions */}
          {!isOutOfStock && (
            <div className="space-y-4 pt-4">
              {isApparelOrMerch && (
                <div className="space-y-3 border-b border-gray-200 pb-4 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm font-semibold uppercase tracking-wider">Select Size</span>
                    {selectedSize && (
                      <span className="text-xs text-primary font-bold bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md">Size: {selectedSize}</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {['S', 'M', 'L', 'XL'].map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        className={`w-12 h-12 rounded-xl text-sm font-bold border transition-all flex items-center justify-center ${
                          selectedSize === size
                            ? 'bg-primary text-white border-primary shadow-sm scale-95'
                            : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-4">
                <span className="text-gray-600 text-sm font-medium">Quantity:</span>
                <div className="flex items-center border border-gray-300 rounded-lg bg-white">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3.5 py-1.5 text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    -
                  </button>
                  <span className="px-4 text-sm font-bold text-gray-900">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="px-3.5 py-1.5 text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <Button
                  onClick={() => {
                    if (isApparelOrMerch && !selectedSize) {
                      alert("Please select a size (S, M, L, or XL) before adding to cart!");
                      return;
                    }
                    addItem(product, quantity, selectedSize || undefined);
                    alert(`Added to cart! ${selectedSize ? `Size: ${selectedSize}` : ''}`);
                  }}
                  className="flex-grow py-3.5"
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Add To Cart
                </Button>

                {user && (
                  <button
                    onClick={() => toggleWishlist(user.id, product)}
                    className={`px-4 rounded-xl border backdrop-blur-md transition-all flex items-center justify-center ${
                      liked ? 'bg-danger/10 text-danger border-danger/20' : 'bg-white border-gray-300 text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Heart className={`h-5 w-5 ${liked ? 'fill-current' : ''}`} />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reviews and Q&A Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 border-t border-gray-200 pt-16">
        {/* Left Side: Reviews (8 cols on large screen) */}
        <div className="lg:col-span-8 space-y-10">
          <h2 className="text-2xl font-extrabold text-gray-900 flex items-center space-x-2">
            <Star className="h-6 w-6 text-yellow-500 fill-current" />
            <span>Customer Reviews</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 bg-gray-50 border border-gray-200 p-6 sm:p-8 rounded-2xl">
            {/* Rating summary chart */}
            <div className="md:col-span-4 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-gray-200 pb-6 md:pb-0 md:pr-6">
              <span className="text-5xl font-extrabold text-gray-900">{averageRating}</span>
              <div className="flex text-yellow-500 my-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.floor(averageRating) ? 'fill-current' : 'text-gray-600'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-500">Based on {reviews.length} ratings</span>
            </div>

            {/* Distribution bars */}
            <div className="md:col-span-8 space-y-2.5 flex flex-col justify-center">
              {[5, 4, 3, 2, 1].map((stars) => {
                const percent = getRatingPercentage(stars);
                return (
                  <div key={stars} className="flex items-center space-x-3 text-xs text-gray-500">
                    <span className="w-10 text-right">{stars} Star</span>
                    <div className="flex-grow h-2.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${percent}%` }} />
                    </div>
                    <span className="w-8 text-left">{percent}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form to submit review */}
          {user && (
            <form onSubmit={handleReviewSubmit} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="font-bold text-lg text-gray-900">Share Your Review</h3>
              {userCanReview && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                  Verified Purchase
                </span>
              )}
              
              {/* Rating Input */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 font-medium">Your Rating:</span>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((stars) => (
                    <button
                      key={stars}
                      type="button"
                      onClick={() => setReviewRating(stars)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`h-6 w-6 ${
                          stars <= reviewRating ? 'text-yellow-500 fill-current' : 'text-gray-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Review Text */}
              <div>
                <textarea
                  rows={4}
                  required
                  placeholder="What did you like or dislike? Write your detailed review here..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-primary resize-none"
                />
              </div>

              {/* Image upload */}
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 block">
                  Add Photos (Up to 5)
                </span>
                <div className="flex flex-wrap gap-3 items-center">
                  <label className="w-16 h-16 rounded-xl border border-gray-300 hover:border-gray-400 border-dashed flex flex-col items-center justify-center cursor-pointer bg-gray-50 hover:bg-gray-100 transition-all">
                    <Plus className="h-5 w-5 text-gray-500" />
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </label>
                  {reviewImages.map((file, idx) => (
                    <div key={idx} className="w-16 h-16 rounded-xl overflow-hidden border border-gray-300 relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeReviewImage(idx)}
                        className="absolute inset-0 bg-background/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity text-danger"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <Button type="submit" loading={reviewLoading}>Submit Review</Button>
            </form>
          )}

          {/* Review Filter and Sorting controls */}
          {reviews.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-gray-500 uppercase">Filter:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setRatingFilter('All')}
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${
                      ratingFilter === 'All'
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'border-gray-300 hover:border-gray-400 text-gray-600'
                    }`}
                  >
                    All Reviews
                  </button>
                  {[5, 4, 3, 2, 1].map((stars) => (
                    <button
                      key={stars}
                      onClick={() => setRatingFilter(stars)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${
                        ratingFilter === stars
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'border-gray-300 hover:border-gray-400 text-gray-600'
                      }`}
                    >
                      {stars} Star
                    </button>
                  ))}
                </div>
              </div>

              <select
                value={reviewSort}
                onChange={(e) => setReviewSort(e.target.value as any)}
                className="bg-white border border-gray-300 text-xs text-gray-900 rounded-lg py-1.5 px-2.5 focus:outline-none"
              >
                <option value="newest" className="bg-white">Newest Reviews</option>
                <option value="oldest" className="bg-white">Oldest Reviews</option>
                <option value="highest" className="bg-white">Highest Rating</option>
                <option value="lowest" className="bg-white">Lowest Rating</option>
              </select>
            </div>
          )}

          {/* Review items listing */}
          <div className="space-y-6">
            {displayedReviews.length === 0 ? (
              <p className="text-gray-500 text-sm italic">No reviews found matching the filters.</p>
            ) : (
              displayedReviews.map((review) => (
                <div key={review.id} className="border-b border-gray-200 pb-6 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                      <div className="h-9 w-9 rounded-full bg-gray-100 border border-gray-300 flex items-center justify-center font-bold text-gray-600">
                        {review.user_name[0].toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm">{review.user_name}</h4>
                        <div className="flex items-center space-x-2 mt-0.5">
                          <div className="flex text-yellow-500">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${
                                  i < review.rating ? 'fill-current' : 'text-gray-600'
                                }`}
                              />
                            ))}
                          </div>
                          {review.verified_purchase && (
                            <span className="text-[10px] font-semibold text-secondary bg-secondary/10 border border-secondary/20 px-1.5 py-0.2 rounded uppercase">
                              Verified Buyer
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 leading-relaxed font-light pl-12">
                    {review.review_text}
                  </p>

                  {/* Review Images */}
                  {review.review_images && review.review_images.length > 0 && (
                    <div className="flex gap-2 pl-12">
                      {review.review_images.map((img, idx) => (
                        <a key={idx} href={img} target="_blank" rel="noreferrer" className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 hover:opacity-80 transition-opacity">
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Like Button */}
                  <div className="flex items-center space-x-4 pl-12 pt-1.5">
                    <button
                      onClick={() => handleLikeReview(review.id)}
                      className={`flex items-center space-x-1.5 text-xs ${
                        review.is_liked_by_user ? 'text-primary' : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      <ThumbsUp className="h-3.5 w-3.5" />
                      <span>{review.likes_count || 0} Helpful</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Product Q&A (4 cols on large screen) */}
        <div className="lg:col-span-4 space-y-8 bg-gray-50 border border-gray-200 p-6 rounded-2xl h-fit">
          <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
            <HelpCircle className="h-5.5 w-5.5 text-secondary" />
            <span>Product Q&A</span>
          </h2>

          {/* Ask Question Form */}
          {user ? (
            <form onSubmit={handleQuestionSubmit} className="space-y-3">
              <input
                type="text"
                required
                placeholder="Ask about materials, size, shipping..."
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-xs glass-input placeholder-gray-500 focus:outline-none"
              />
              <Button type="submit" size="sm" loading={qnaLoading} className="w-full py-2">
                Submit Question
              </Button>
            </form>
          ) : (
            <p className="text-xs text-gray-500 italic">
              Please{' '}
              <Link to="/auth" className="text-primary hover:underline font-medium">
                sign in
              </Link>{' '}
              to ask a question.
            </p>
          )}

          {/* Question Answers List */}
          <div className="space-y-5 divide-y divide-gray-200 pt-4">
            {questions.length === 0 ? (
              <p className="text-xs text-gray-500 italic py-2">No questions asked yet. Be the first to ask!</p>
            ) : (
              questions.map((q) => (
                <div key={q.id} className="pt-4 first:pt-0 space-y-2">
                  <div className="text-xs font-bold text-gray-900 flex items-start gap-1">
                    <span className="text-secondary flex-shrink-0">Q:</span>
                    <span>{q.question}</span>
                  </div>
                  {q.answer ? (
                    <div className="text-xs text-gray-600 pl-4 border-l border-primary/30 flex items-start gap-1">
                      <span className="text-primary font-bold flex-shrink-0">A:</span>
                      <p className="leading-relaxed">{q.answer}</p>
                    </div>
                  ) : (
                    <div className="text-[10px] text-gray-500 pl-4 border-l border-gray-200 italic">
                      Waiting for admin response...
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Related Products Carousel/Grid */}
      {relatedProducts.length > 0 && (
        <section className="space-y-8 border-t border-gray-200 pt-16">
          <h2 className="text-2xl font-extrabold text-gray-900">Related Merchandise</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((prod) => (
              <div
                key={prod.id}
                onClick={() => {
                  navigate(`/product/${prod.slug}`);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col group cursor-pointer hover:border-primary transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <div className="aspect-[4/5] bg-gray-50 overflow-hidden relative">
                  <img src={prod.main_image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </div>
                <div className="p-4 flex flex-col flex-grow">
                  <h3 className="font-bold text-sm text-gray-900 group-hover:text-primary transition-colors truncate">{prod.name}</h3>
                  <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100">
                    <span className="font-bold text-sm text-gray-900">₹{prod.price}</span>
                    <span className="text-[9px] font-bold text-success">In Stock</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
