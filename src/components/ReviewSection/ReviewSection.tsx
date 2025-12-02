import React, { useEffect, useState } from "react";
import api from "../../api/axiosInstance";
import "./ReviewSection.css"; 

interface ReviewResponse {
  id: number;
  rating: number; // Số sao của đánh giá này
  comment: string;
  userFullName: string;
  createdAt: string;
}

// Thêm prop onStatsUpdate để truyền dữ liệu ngược lên cha
interface ReviewSectionProps {
  productId: number;
  onStatsUpdate?: (avgRating: number, totalReviews: number) => void;
}

const ReviewSection: React.FC<ReviewSectionProps> = ({ productId, onStatsUpdate }) => {
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);

  // Load Reviews
  const fetchReviews = async () => {
    try {
      // Lấy 100 review để tính toán cho chính xác (tạm thời)
      const res = await api.get(`/reviews/product/${productId}`, {
        params: { page, size: 10 }, 
      });
      
      if (res.data && res.data.data) {
        const fetchedReviews: ReviewResponse[] = res.data.data;
        setReviews(fetchedReviews);
        
        // --- 🟢 TÍNH TOÁN SỐ SAO TRUNG BÌNH TẠI ĐÂY ---
        if (onStatsUpdate) {
            // Lọc ra các review có rating (tránh trường hợp null/undefined)
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
    }
  };

  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, page]);

  // Submit Review
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
      alert("Cảm ơn bạn đã đánh giá!");
      setComment("");
      setRating(5);
      fetchReviews(); // Reload lại list và tính lại sao
    } catch (error: any) {
      const msg = error.response?.data?.message || "Lỗi khi gửi đánh giá";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (points: number, interactive: boolean = false) => {
    return (
      <div className="stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`star ${star <= points ? "filled" : ""}`}
            onClick={() => interactive && setRating(star)}
            style={{ cursor: interactive ? "pointer" : "default" }}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="review-section">
      <h3>Đánh giá sản phẩm</h3>

      <div className="review-form">
        <div className="rating-select">
          <span>Chọn số sao:</span>
          {renderStars(rating, true)}
        </div>
        <textarea
          placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <button onClick={handleSubmit} disabled={loading}>
          {loading ? "Đang gửi..." : "Gửi đánh giá"}
        </button>
      </div>

      <hr />

      <div className="review-list">
        {reviews.length === 0 ? (
          <p className="no-reviews">Chưa có đánh giá nào.</p>
        ) : (
          reviews.map((r) => (
            <div key={r.id} className="review-item">
              <div className="review-header">
                <strong>{r.userFullName || "Khách hàng"}</strong>
                {renderStars(r.rating)}
              </div>
              <p className="review-date">{new Date(r.createdAt).toLocaleDateString('vi-VN')}</p>
              <p className="review-content">{r.comment}</p>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="review-pagination">
             <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Trước</button>
             <span>{page} / {totalPages}</span>
             <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Sau</button>
        </div>
      )}
    </div>
  );
};

export default ReviewSection;