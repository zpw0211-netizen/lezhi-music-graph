import { publicAssetUrl } from "../../lib/app/assets";

// The 芽谱AI sprout-and-note mark (public/brand/yapu-ai-mark.webp), used beside the name in the top bar.
export function BrandMark() {
  return <img className="brand-mark-img" src={publicAssetUrl("brand/yapu-ai-mark.webp")} alt="" aria-hidden="true" width={139} height={160} />;
}

// The mark with the name 芽谱 (public/brand/yapu-logo.webp); 「AI · 音乐数字教材平台」 is set as page text below it.
export function BrandLogo({ className = "brand-logo-img" }: { className?: string }) {
  return <img className={className} src={publicAssetUrl("brand/yapu-logo.webp")} alt="芽谱" width={900} height={408} />;
}
