// Only publishable connection information belongs in the browser bundle.
export const ACCOUNT_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://geqowfddhdokqskesjtb.supabase.co";
export const ACCOUNT_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_pbl9Qh6M0Ix1DE1J7Pyccg_bjeiIiYv";
// Enable only after delivery, recovery, permissions and the production function pass verification.
export const ACCOUNTS_ENABLED = process.env.NEXT_PUBLIC_ACCOUNTS_ENABLED === "true";
export const PHONE_ENABLED = process.env.NEXT_PUBLIC_PHONE_AUTH_ENABLED === "true";

export const REGIONS = ["北京市", "天津市", "河北省", "山西省", "内蒙古自治区", "辽宁省", "吉林省", "黑龙江省", "上海市", "江苏省", "浙江省", "安徽省", "福建省", "江西省", "山东省", "河南省", "湖北省", "湖南省", "广东省", "广西壮族自治区", "海南省", "重庆市", "四川省", "贵州省", "云南省", "西藏自治区", "陕西省", "甘肃省", "青海省", "宁夏回族自治区", "新疆维吾尔自治区", "香港特别行政区", "澳门特别行政区", "台湾省"];
export const PASSWORD_RULES = [
  { label: "至少 8 位", test: (value: string) => value.length >= 8 },
  { label: "大写字母", test: (value: string) => /[A-Z]/.test(value) },
  { label: "小写字母", test: (value: string) => /[a-z]/.test(value) },
  { label: "数字", test: (value: string) => /[0-9]/.test(value) },
];
export function normalizePhone(value: string) {
  const phone = value.replace(/[\s()-]/g, "");
  const normalized = /^1[3-9]\d{9}$/.test(phone) ? `+86${phone}` : phone;
  if (!/^\+[1-9]\d{7,14}$/.test(normalized)) throw new Error("请填写正确的手机号，海外号码请带国家区号。");
  return normalized;
}
