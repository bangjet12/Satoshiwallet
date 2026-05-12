export default function BrandMark({ className = "" }) {
  return (
    <div
      data-testid="brand-mark"
      className={`font-inter font-light tracking-tight text-[15px] text-white/85 select-none flex items-center ${className}`}
    >
      <span>satoshi</span>
      <span className="text-[#F7931A] ml-0.5">.</span>
    </div>
  );
}
