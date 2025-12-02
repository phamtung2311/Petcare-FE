import React from 'react';

// Link ảnh icon (Bạn có thể thay bằng file trong máy nếu muốn)
const ZALO_ICON_URL = "https://upload.wikimedia.org/wikipedia/commons/9/91/Icon_of_Zalo.svg";
const AI_ICON_URL = "https://cdn-icons-png.flaticon.com/512/4712/4712035.png"; 

interface ContactButtonsProps {
    onToggleChat: () => void; // Hàm để bật/tắt chat
    isOpen: boolean;          // Trạng thái đang mở hay đóng
}

const ContactButtons: React.FC<ContactButtonsProps> = ({ onToggleChat, isOpen }) => {

    // --- CẤU HÌNH SỐ ĐIỆN THOẠI ZALO CỦA BẠN TẠI ĐÂY ---
    const MY_ZALO_PHONE = "0395052871"; 

    return (
        <div style={styles.container}>
            {/* 1. NÚT ZALO */}
            <a 
                href={`https://zalo.me/${MY_ZALO_PHONE}`} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{...styles.button, ...styles.zaloButton}}
                title="Chat qua Zalo"
            >
                <img src={ZALO_ICON_URL} alt="Zalo" style={styles.icon} />
            </a>

            {/* 2. NÚT CHAT AI */}
            <button 
                onClick={onToggleChat}
                style={{...styles.button, ...styles.aiButton}}
                title="Hỏi trợ lý ảo"
            >
                {isOpen ? (
                    // Dấu X khi đang mở
                    <span style={{fontSize: '24px', fontWeight: 'bold', color: 'white'}}>×</span>
                ) : (
                    // Icon Robot khi đang đóng
                    <img src={AI_ICON_URL} alt="AI" style={styles.icon} />
                )}
            </button>
        </div>
    );
};

// CSS Styles (Viết inline cho gọn, bạn có thể tách ra file css riêng)
const styles: { [key: string]: React.CSSProperties } = {
    container: {
        position: 'fixed',
        bottom: '30px',
        right: '30px',
        display: 'flex',
        flexDirection: 'column', // Xếp dọc
        gap: '15px',
        zIndex: 2000, // Luôn nổi lên trên cùng
    },
    button: {
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        transition: 'transform 0.2s',
    },
    zaloButton: {
        backgroundColor: '#0068FF', // Xanh Zalo
    },
    aiButton: {
        backgroundColor: '#FF6B6B', // Đỏ cam cho AI
    },
    icon: {
        width: '35px',
        height: '35px',
        objectFit: 'contain',
    }
};

export default ContactButtons;