export default function SnapgramLogo({ className = "w-48 h-auto text-black dark:text-white" }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 120" className={className}>
      <style>
        {`
          .logo-text {
            font-family: 'Billabong', 'Grand Hotel', 'Pacifico', cursive;
            font-size: 85px;
            fill: currentColor;
          }
        `}
      </style>
      <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" className="logo-text">
        Snapgram
      </text>
    </svg>
  );
}