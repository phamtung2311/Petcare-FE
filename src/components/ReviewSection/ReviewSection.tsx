import React, { useEffect, useState } from "react";
import api from "../../api/axiosInstance";
import "./ReviewSection.css"; 

interface ReviewResponse {
  id: number;
  rating: number;
  comment: string;
  userFullName: string;
  createdAt: string;
}

interface ReviewSectionProps {
  productId: number;
  // Prop này dùng để báo cho component cha (Modal) biết số sao trung bình 
  // để hiển thị ngay dưới tên sản phẩm.
  onStatsUpdate?: (avgRating: number, totalReviews: number) => void;
}

const ReviewSection: React.FC<ReviewSectionProps> = ({ productId, onStatsUpdate }) => {
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);

  // Helper: Lấy chữ cái đầu của tên để làm Avatar
  const getInitials = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : "U";
  };

  // Helper: Render sao
  const renderStars = (points: number, interactive: boolean = false) => {
    return (
      <div className="stars-wrapper">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`star-icon ${star <= points ? "filled" : ""}`}
            onClick={() => interactive && setRating(star)}
            style={{ cursor: interactive ? "pointer" : "default" }}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  const fetchReviews = async () => {
    try {
      // Lấy 100 item để tính trung bình sao cho chính xác hơn ở phía Client
      const res = await api.get(`/reviews/product/${productId}`, {
        params: { page: page - 1, size: 10 }, // API thường bắt đầu page từ 0
      });
      
      if (res.data && res.data.data) {
        const responseData = res.data.data;
        const fetchedReviews: ReviewResponse[] = responseData.items || responseData.content || [];
        setReviews(fetchedReviews);
        
        // Logic tính toán số sao trung bình để gửi ngược lên cha
        if (onStatsUpdate) {
            const validReviews = fetchedReviews.filter(r => r.rating > 0);
            const totalCount = res.data.pagination ? res.data.pagination.totalElements : validReviews.length;
            
            if (validReviews.length > 0) {
                const sum = validReviews.reduce((acc, curr) => acc + curr.rating, 0);
                const avg = sum / validReviews.length;
                onStatsUpdate(avg, totalCount);
            } else {
                onStatsUpdate(0, 0);
            }
        }

        const pagination = res.data.pagination;
        if (pagination) setTotalPages(pagination.totalPages);
      }
    } catch (error) {
      console.error("Lỗi tải đánh giá:", error);
      setReviews([]);
    }
  };

  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, page]);

  const handleSubmit = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      alert("Bạn cần đăng nhập để đánh giá!");
      return;
    }
    if (!comment.trim()) {
      alert("Vui lòng nhập nội dung đánh giá");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        productId: productId,
        rating: rating,
        comment: comment,
      };
      
      await api.post("/reviews/comment", payload);
      setComment("");
      setRating(5);
      fetchReviews(); 
      alert("Cảm ơn đánh giá của bạn!");
    } catch (error: any) {
      const msg = error.response?.data?.message || "Lỗi khi gửi đánh giá";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="review-container">
      {/* Form viết đánh giá */}
      <div className="review-input-card">
        <div className="input-header">
            <span className="input-label">Đánh giá của bạn:</span>
            {renderStars(rating, true)}
        </div>
        <div className="input-body">
            <textarea
            className="review-textarea"
            placeholder="Sản phẩm thế nào? Hãy chia sẻ cảm nhận..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            />
            <button className="btn-submit-review" onClick={handleSubmit} disabled={loading}>
                {loading ? <span className="spinner-small"></span> : "Gửi Đánh Giá"}
            </button>
        </div>
      </div>

      <div className="review-divider"></div>

      {/* Danh sách đánh giá */}
      <div className="review-list">
        {reviews.length === 0 ? (
          <div className="no-reviews">
             <i className="far fa-comment-dots"></i>
             <p>Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
          </div>
        ) : (
          reviews.map((r) => (
            <div key={r.id} className="review-card">
              <div className="review-avatar">
                  {getInitials(r.userFullName)}
              </div>
              <div className="review-content">
                <div className="review-top-row">
                    <span className="review-user-name">{r.userFullName || "Khách hàng ẩn danh"}</span>
                    <span className="review-time">{new Date(r.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
                <div className="review-stars-static">
                    {renderStars(r.rating)}
                </div>
                <p className="review-text">{r.comment}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="review-pagination">
             <button className="pagi-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                &laquo;
             </button>
             <span className="pagi-info">{page} / {totalPages}</span>
             <button className="pagi-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                &raquo;
             </button>
        </div>
      )}
    </div>
  );
};

export default ReviewSection;