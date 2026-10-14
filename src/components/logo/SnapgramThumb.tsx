export default function SnapgramThumb({ className = "w-6 h-6" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Khung máy ảnh bo góc */}
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      
      {/* Chữ S uốn lượn ở giữa */}
      <path d="M15 10c0-1.5-1.5-2.5-3-2.5S9 8.5 9 10c0 2 6 1.5 6 3.5s-1.5 2.5-3 2.5-3-1-3-2.5" />
      
      {/* Dấu chấm ống kính/đèn flash ở góc trên phải */}
      <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}