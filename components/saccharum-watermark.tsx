import Image from "next/image";

/**
 * Saccharum Technologies is the holding company behind KheZwo. It should
 * never take the spotlight — this component is intentionally small, low
 * contrast, and easy to skim past. Use it in footers and in the platform
 * reporting area (admin > settings / about), nowhere else.
 */
export function SaccharumWatermark({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex items-center gap-1.5 text-xs text-neutral-400 ${className}`}
    >
      <Image
        src="/saccharum-logo.png"
        alt=""
        width={16}
        height={16}
        className="opacity-60"
        aria-hidden
      />
      <span>A product of Saccharum Technologies</span>
    </div>
  );
}
