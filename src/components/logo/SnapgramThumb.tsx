type SnapgramThumbProps = {
  className?: string;
};

const PALETTE = {
  outline: "#2b1a4f",
  band1: "#8b5cf6", // tím
  band2: "#ec4899", // hồng
  band3: "#fb923c", // cam
  band4: "#fcd34d", // vàng
  letter: "#ffffff",
  flash: "#fef08a",
};

// Chữ S 5x7 pixel: [x lệch, y lệch, độ rộng]
const S_ROWS: [number, number, number][] = [
  [1, 0, 4],
  [0, 1, 1],
  [0, 2, 1],
  [1, 3, 3],
  [4, 4, 1],
  [4, 5, 1],
  [0, 6, 4],
];

const sPath = (ox: number, oy: number) =>
  S_ROWS.map(([dx, dy, w]) => `M${ox + dx} ${oy + dy}h${w}v1h-${w}z`).join("");

// Dải màu phủ chồng từ y=a xuống đáy -> không lộ khe
const bandFrom = (a: number) => `M2 ${a}H14V13H13V14H3V13H2Z`;

export default function SnapgramThumb({
  className = "w-32 h-32",
}: SnapgramThumbProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      className={className}
    >
      {/* Nền chuyển màu: tím → hồng → cam → vàng */}
      <path d="M3 2H13V3H14V13H13V14H3V13H2V3H3Z" fill={PALETTE.band1} />
      <path d={bandFrom(5)} fill={PALETTE.band2} />
      <path d={bandFrom(8)} fill={PALETTE.band3} />
      <path d={bandFrom(11)} fill={PALETTE.band4} />

      {/* Khung máy ảnh bo góc kiểu pixel */}
      <path
        d="M3 1h10v1h-10zM3 14h10v1h-10zM1 3h1v10h-1zM14 3h1v10h-1zM2 2h1v1h-1zM13 2h1v1h-1zM2 13h1v1h-1zM13 13h1v1h-1z"
        fill={PALETTE.outline}
      />

      {/* Điểm sáng góc trên trái */}
      <path d="M3 3h2v1h-2zM3 4h1v1h-1z" fill="#ffffff" opacity={0.55} />

      {/* Đèn flash góc trên phải */}
      <path d="M11 3h2v2h-2z" fill={PALETTE.flash} />
      <path d="M11 3h1v1h-1z" fill={PALETTE.letter} />

      {/* Chữ S: bóng đổ + chữ */}
      <path d={sPath(6, 6)} fill={PALETTE.outline} />
      <path d={sPath(5, 5)} fill={PALETTE.letter} />
    </svg>
  );
}