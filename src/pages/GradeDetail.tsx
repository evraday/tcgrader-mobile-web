import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store';
import Button from '../components/common/Button';
import api from '../services/api';

const GradeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [card, setCard] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [priceHistory, setPriceHistory] = useState<any[]>([]);
  const [loadingPriceHistory, setLoadingPriceHistory] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showListModal, setShowListModal] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    if (id) {
      fetchCardDetail();
    }
  }, [id]);

  const fetchCardDetail = async () => {
    try {
      const response = await api.getCard(id!);
      setCard(response);
      
      // Fetch price history if available
      try {
        const priceData = await api.getPriceHistory(id!, 30);
        setPriceHistory(Array.isArray(priceData) ? priceData : (priceData?.priceHistory || []));
      } catch (error) {
        console.log('Price history not available');
        setPriceHistory([]);
      }
      
      // Fetch comments if available
      try {
        const commentsData = await api.get(`/api/cards/${id}/comments`);
        setComments(Array.isArray(commentsData) ? commentsData : (commentsData?.comments || []));
      } catch (error) {
        console.log('Comments not available');
        setComments([]);
      }
    } catch (error) {
      console.error('Failed to fetch card details:', error);
      navigate('/grades');
    } finally {
      setIsLoading(false);
      setLoadingPriceHistory(false);
      setLoadingComments(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    try {
      const response = await api.post(`/api/cards/${id}/comments`, {
        comment: newComment.trim()
      });
      
      const newCommentData = {
        _id: Date.now().toString(),
        comment: newComment.trim(),
        user: {
          username: user?.username,
          avatar: user?.avatar
        },
        createdAt: new Date().toISOString()
      };
      
      setComments([newCommentData, ...comments]);
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const getCardImages = () => {
    const images = [];
    
    // Handle different image structures
    if (card.images?.frontUrl) {
      images.push({ url: card.images.frontUrl, label: 'Front' });
    } else if (card.images?.front) {
      images.push({ url: card.images.front, label: 'Front' });
    }
    
    if (card.images?.backUrl) {
      images.push({ url: card.images.backUrl, label: 'Back' });
    } else if (card.images?.back) {
      images.push({ url: card.images.back, label: 'Back' });
    }
    
    // Fallback to single image if structure is different
    if (images.length === 0 && (card.imageUrl || card.image)) {
      images.push({ url: card.imageUrl || card.image, label: 'Card' });
    }
    
    return images;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-primary-400"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading card details...</p>
        </div>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="min-h-screen dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Card not found</p>
          <Link to="/grades">
            <Button variant="secondary" className="mt-4">Back to Grades</Button>
          </Link>
        </div>
      </div>
    );
  }

  const latestGrade = card.gradingResults?.[0] || card.raw?.combined;
  const overallScore = latestGrade?.scores?.overall || latestGrade?.overall;
  const cardImages = getCardImages();

  return (
    <div className="min-h-screen dark:bg-black pb-24">
      {/* Header */}
      <div className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 safe-area-top">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/grades')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">{card.name || 'Card Details'}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {card.setName || card.set || 'Unknown Set'}
                  {card.number && ` • #${card.number}`}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {overallScore && (
                <div className={`px-3 py-1.5 rounded-full ${
                  overallScore >= 9 ? 'bg-green-600' :
                  overallScore >= 8 ? 'bg-blue-600' :
                  overallScore >= 7 ? 'bg-yellow-600' :
                  overallScore >= 6 ? 'bg-orange-600' :
                  'bg-red-600'
                }`}>
                  <span className="text-sm font-bold text-white">{overallScore}</span>
                </div>
              )}
              
              <button
                onClick={() => setShowListModal(true)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        {/* Swipeable Card Images */}
        <div className="mb-6">
          <div className="relative aspect-[3/4] bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden">
            {cardImages.length > 0 ? (
              <>
                <img 
                  src={cardImages[currentImageIndex]?.url}
                  alt={`${card.name} - ${cardImages[currentImageIndex]?.label}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://www.tcgrader.com/images/card-placeholder.png';
                  }}
                />
                
                {/* Image Navigation */}
                {cardImages.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentImageIndex(currentImageIndex > 0 ? currentImageIndex - 1 : cardImages.length - 1)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                    >
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setCurrentImageIndex(currentImageIndex < cardImages.length - 1 ? currentImageIndex + 1 : 0)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                    >
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    
                    {/* Image Indicators */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-2">
                      {cardImages.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                          }`}
                        />
                      ))}
                    </div>
                    
                    {/* Image Label */}
                    <div className="absolute top-3 left-3 px-2 py-1 bg-black/50 rounded-lg">
                      <span className="text-xs text-white font-medium">
                        {cardImages[currentImageIndex]?.label}
                      </span>
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                <svg className="w-16 h-16 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Grade Information */}
        {latestGrade && (
          <>
            <div className={`p-6 rounded-2xl text-white mb-6 ${
              (overallScore || 0) >= 9 ? 'bg-gradient-to-r from-green-600 to-green-700' :
              (overallScore || 0) >= 8 ? 'bg-gradient-to-r from-blue-600 to-blue-700' :
              (overallScore || 0) >= 7 ? 'bg-gradient-to-r from-yellow-600 to-yellow-700' :
              (overallScore || 0) >= 6 ? 'bg-gradient-to-r from-orange-600 to-orange-700' :
              'bg-gradient-to-r from-red-600 to-red-700'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm opacity-90">AI Grade</p>
                  <p className="text-3xl font-bold">{overallScore || 'N/A'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm opacity-90">
                    {card.tcgmodel === 'V2' ? 'AI v2' : 
                     latestGrade.model === 'dual-ai' ? 'Dual AI' : 
                     latestGrade.model || 'AI'}
                  </p>
                  {card.createdAt && (
                    <p className="text-xs opacity-75">
                      {new Date(card.createdAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Subgrades */}
              {(latestGrade.scores || latestGrade) && (
                <div className="grid grid-cols-4 gap-3 mt-4">
                  <div className="text-center">
                    <div className="text-xs opacity-75">Corners</div>
                    <div className="font-semibold">{latestGrade.scores?.corners || latestGrade.corners || 'N/A'}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs opacity-75">Edges</div>
                    <div className="font-semibold">{latestGrade.scores?.edges || latestGrade.edges || 'N/A'}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs opacity-75">Surface</div>
                    <div className="font-semibold">{latestGrade.scores?.surface || latestGrade.surface || 'N/A'}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs opacity-75">Centering</div>
                    <div className="font-semibold">{latestGrade.scores?.centering || latestGrade.centering || 'N/A'}</div>
                  </div>
                  {(latestGrade.scores?.holographic || latestGrade.holographic) && (
                    <div className="text-center col-span-4 mt-2">
                      <div className="text-xs opacity-75">Holographic</div>
                      <div className="font-semibold">{latestGrade.scores?.holographic || latestGrade.holographic}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* AI Summary */}
            {latestGrade.summary && (
              <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-lg mb-6">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">AI Assessment</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{latestGrade.summary}</p>
              </div>
            )}
            
            {/* Defects */}
            {latestGrade.defects && latestGrade.defects.length > 0 && (
              <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-lg mb-6">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Identified Issues</h4>
                <div className="space-y-3">
                  {latestGrade.defects.slice(0, 5).map((defect: any, index: number) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                        Number(defect.significancy || defect.significance) > 500 ? 'bg-red-500' : 
                        Number(defect.significancy || defect.significance) > 300 ? 'bg-yellow-500' : 'bg-green-500'
                      }`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {defect.name || defect.description}
                        </p>
                        {defect.description && defect.name !== defect.description && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{defect.description}</p>
                        )}
                        {defect.location && (
                          <span className="text-xs text-gray-500 dark:text-gray-500 capitalize">
                            {defect.location.replace(/[_-]/g, ' ')}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Card Information */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg mb-6">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Card Information</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Set</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {card.setName || card.set || 'Unknown'}
              </span>
            </div>
            {card.number && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Number</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{card.number}</span>
              </div>
            )}
            {card.year && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Year</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{card.year}</span>
              </div>
            )}
            {card.manufacturer && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Manufacturer</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{card.manufacturer}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Graded</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {card.createdAt ? new Date(card.createdAt).toLocaleDateString() : 'Unknown'}
              </span>
            </div>
          </div>
        </div>

        {/* Price History Chart */}
        {!loadingPriceHistory && priceHistory.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg mb-6">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">30-Day Price History</h4>
            <div className="h-32 flex items-end space-x-1">
              {priceHistory.map((point, index) => {
                const maxPrice = Math.max(...priceHistory.map(p => p.price || 0));
                const height = maxPrice > 0 ? (point.price / maxPrice) * 100 : 0;
                return (
                  <div
                    key={index}
                    className="flex-1 bg-primary-500 rounded-t"
                    style={{ height: `${height}%` }}
                    title={`$${point.price} on ${new Date(point.date).toLocaleDateString()}`}
                  />
                );
              })}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
              <span>30 days ago</span>
              <span>Today</span>
            </div>
          </div>
        )}

        {/* Comments Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Comments ({comments.length})
            </h4>
          </div>

          {/* Add Comment */}
          <div className="mb-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-white">
                  {user?.username?.charAt(0)?.toUpperCase() || user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all resize-none text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
                <div className="flex justify-end mt-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                  >
                    Post Comment
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Comments List */}
          {loadingComments ? (
            <div className="text-center py-6">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 dark:border-primary-400"></div>
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment._id} className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                    {comment.user?.avatar ? (
                      <img 
                        src={comment.user.avatar}
                        alt={comment.user.username}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                        {comment.user?.username?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {comment.user?.username || 'Anonymous'}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {comment.createdAt && new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {comment.comment}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No comments yet. Be the first to comment!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* List for Sale Modal */}
      {showListModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-t-3xl p-6 w-full max-w-md animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">List for Sale</h2>
              <button
                onClick={() => setShowListModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Card Preview */}
              <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <img 
                  src={cardImages[0]?.url || 'https://www.tcgrader.com/images/card-placeholder.png'}
                  alt={card.name}
                  className="w-16 h-20 object-cover rounded-lg"
                  onError={(e) => {
                    e.currentTarget.src = 'https://www.tcgrader.com/images/card-placeholder.png';
                  }}
                />
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-white">{card.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {overallScore ? `AI Grade ${overallScore}/10` : 'Ungraded'}
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    Est. Value: ${(card.prices?.currentPrice || card.value || 0).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Listing Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Listing Price
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    defaultValue={card.prices?.currentPrice || card.value}
                    className="w-full pl-8 pr-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Quick Price Options */}
              <div className="flex space-x-2">
                <button className="flex-1 py-2 px-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">
                  -10%
                </button>
                <button className="flex-1 py-2 px-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">
                  Market
                </button>
                <button className="flex-1 py-2 px-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">
                  +10%
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowListModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  className="flex-1"
                  onClick={() => {
                    // TODO: Implement listing logic
                    alert('Listing functionality coming soon!');
                    setShowListModal(false);
                  }}
                >
                  List Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GradeDetailPage;