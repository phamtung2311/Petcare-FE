import React, { useEffect, useState } from "react";
import api from "../../api/axiosInstance";
import { useNavigate, useSearchParams } from "react-router-dom"; 
import "./Customer.css";

// 🟢 ĐÃ SỬA LẠI THÀNH 30 THEO YÊU CẦU
const PAGE_SIZE = 30; 

interface Category {
  id: number;
  name: string;
}

interface ProductImage {
  id: number;
  imageUrl: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
  description?: string;
  categoryId?: number;
  categoryName?: string;
  stock?: number;
  images?: ProductImage[];
}

const Customer: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [sort, setSort] = useState<string>("id:desc");
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();

  // --- 1. XỬ LÝ URL ---
  useEffect(() => {
    const urlCatId = searchParams.get("categoryId");
    if (urlCatId) {
      setSelectedCategories([Number(urlCatId)]);
    } else {
      setSelectedCategories([]);
    }
  }, [searchParams]);

  // --- 2. LOAD DANH MỤC ---
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get("/categories/list");
        if (res.data && res.data.status === 200 && res.data.data) {
             const categoryData = res.data.data.categories || [];
             setCategories(categoryData);
        }
      } catch (err) {
        console.error("Lỗi categories:", err);
      }
    };
    fetchCategories();
  }, []);

  // --- 3. LOAD SẢN PHẨM ---
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const searchKeyword = searchParams.get("search") || "";
      const typeParam = searchParams.get("type");
      let typeKeyword = "";
      
      if (typeParam === 'food') typeKeyword = "thức ăn";
      else if (typeParam === 'clothes') typeKeyword = "áo";
      else if (typeParam === 'toys') typeKeyword = "đồ chơi";

      const finalKeyword = searchKeyword || typeKeyword;

      const params: any = {
        page: page > 0 ? page - 1 : 0, 
        size: PAGE_SIZE, // Sử dụng constant 30 ở trên
        sort: sort,
        isDeleted: false, // Giữ nguyên fix để hiện sản phẩm giống Admin
      };

      if (finalKeyword) {
          params.keyword = finalKeyword;
      }

      if (selectedCategories.length > 0) {
        params.categoryId = selectedCategories.join(",");
      }

      console.log("Customer API params:", params);
      
      const res = await api.get("/products/list", { params });
      
      if (res.data && res.data.status === 200 && res.data.data) {
        const data = res.data.data;
        const productList = data.products || data.content || [];
        
        setProducts(productList);
        setTotalPages(data.totalPages || 1);
      } else {
          setProducts([]);
      }

    } catch (err) {
      console.error("Lỗi load products", err);
      setProducts([]); 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sort, selectedCategories, searchParams]); 

  // --- HANDLERS ---
  const handleCategoryChange = (id: number) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id]
    );
    setPage(1); 
  };

  const handleFilter = () => {
    setPage(1);
    fetchProducts();
  };

  const handleAddToCart = async (product: Product) => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      alert("Vui lòng đăng nhập để mua hàng!");
      return;
    }
    try {
      await api.post("/cart/add", { productId: product.id, quantity: 1 });
      alert(`Đã thêm "${product.name}" vào giỏ hàng!`);
      window.dispatchEvent(new Event("cartChange"));
    } catch (error: any) {
      alert(error.response?.data?.message || "Thêm vào giỏ thất bại.");
    }
  };

  const handleBuyNow = (product: Product) => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      alert("Vui lòng đăng nhập để mua hàng!");
      return;
    }
    navigate("/checkout", { 
      state: { 
        items: [{ 
            ...product, 
            productId: product.id, 
            quantity: 1, 
            type: 'product' 
        }] 
      } 
    });
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  return (
    <div className="customer-page">
      <aside className="customer-sidebar">
        <h3 className="sidebar-title">Danh Mục</h3>
        <ul className="category-list">
          {categories.map((cat) => (
            <li key={cat.id} className="category-item">
              <label>
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(cat.id)}
                  onChange={() => handleCategoryChange(cat.id)}
                />
                {cat.name}
              </label>
            </li>
          ))}
        </ul>
        <button className="filter-btn" onClick={handleFilter}>Lọc</button>
      </aside>

      <main className="customer-content">
        <div className="customer-content-header">
          <h2>
            {searchParams.get("search") 
              ? `Kết quả tìm kiếm: "${searchParams.get("search")}"` 
              : "Tất cả sản phẩm"}
          </h2>
          <div className="content-controls">
            <select className="sort-select" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="id:desc">Mới nhất</option>
              <option value="price:asc">Giá tăng dần</option>
              <option value="price:desc">Giá giảm dần</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading">Đang tải sản phẩm...</div>
        ) : products.length === 0 ? (
          <div className="empty-state" style={{textAlign:'center', padding: 50, color: '#888'}}>
             <p>Không tìm thấy sản phẩm nào phù hợp.</p>
             <button onClick={() => {
                 setPage(1);
                 setSelectedCategories([]);
                 navigate("/customer"); 
             }} style={{marginTop:10, padding:'8px 15px', cursor:'pointer'}}>
                 Xem tất cả
             </button>
          </div>
        ) : (
          <div className="product-grid">
            {products.map((p) => {
              const firstImageUrl = p.images && p.images.length > 0 ? p.images[0].imageUrl : undefined;
              
              return (
                <div className="product-card" key={p.id}>
                  <div className="product-image-wrap">
                    {firstImageUrl ? (
                      <img src={firstImageUrl} alt={p.name} />
                    ) : (
                      <div className="product-image-placeholder">No Image</div>
                    )}
                    
                    <div className="product-actions-overlay">
                        <button className="action-btn btn-buy-now" onClick={() => handleBuyNow(p)}>Mua Ngay</button>
                        <button className="action-btn btn-add-cart" onClick={() => handleAddToCart(p)}>Thêm vào giỏ</button>
                    </div>
                  </div>

                  <div className="product-info">
                    <div className="product-brand">{p.categoryName || "PetCare"}</div>
                    <div className="product-name" title={p.name}>{p.name}</div>
                    <div className="product-price-wrap">
                      <span className="product-price">
                        {formatCurrency(p.price)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {products.length > 0 && (
            <div className="pagination">
            <button 
                disabled={page <= 1} 
                onClick={() => setPage(page - 1)}
                className={page <= 1 ? "disabled" : ""}
            >
                &laquo; Trước
            </button>
            <span>Trang {page}/{totalPages}</span>
            <button 
                disabled={page >= totalPages} 
                onClick={() => setPage(page + 1)}
                className={page >= totalPages ? "disabled" : ""}
            >
                Sau &raquo;
            </button>
            </div>
        )}
      </main>
    </div>
  );
};

export default Customer;