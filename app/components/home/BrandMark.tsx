import { publicAssetUrl } from "../../lib/app/assets";

// The 芽谱AI sprout-and-note mark (public/brand/yapu-ai-mark.webp), used beside the name in the top bar.
export function BrandMark() {
  return <img className="brand-mark-img" src={publicAssetUrl("brand/yapu-ai-mark.webp")} alt="" aria-hidden="true" width={139} height={160} />;
}

// The full 芽谱AI · 音乐数字教材平台 lockup (public/brand/yapu-ai-logo.webp) for the home hero and about panels.
export function BrandLogo({ className = "brand-logo-img" }: { className?: string }) {
  return <img className={className} src={publicAssetUrl("brand/yapu-ai-logo.webp")} alt="芽谱AI 音乐数字教材平台" width={1200} height={428} />;
}
