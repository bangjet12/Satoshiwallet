export default function PinDots({ length = 6, value = "", shake = false, testid = "pin-dots" }) {
  return (
    <div
      data-testid={testid}
      className={`flex justify-center gap-3 ${shake ? "shake" : ""}`}
    >
      {Array.from({ length }).map((_, i) => {
        const filled = i < value.length;
        return (
          <div
            key={i}
            className={`h-3 w-3 rounded-full transition-colors duration-150 ${
              filled ? "bg-[#F7931A]" : "bg-white/10 border border-white/15"
            }`}
          />
        );
      })}
    </div>
  );
}
