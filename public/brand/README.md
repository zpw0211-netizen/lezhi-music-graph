# 芽谱标志

`mark.svg` 是嫩芽与四分音符组合的图形标记；`logo.svg` 在旁边横排放置「芽谱」字标。`public/favicon.svg` 使用相同的图形标记。

## 字标字体来源

- 字体：霞鹜文楷 LXGW WenKai Regular
- 版本：v1.522（2026-03-17 Release）
- 官方 Release：<https://github.com/lxgw/LxgwWenKai/releases/tag/v1.522>
- TTF 下载：<https://github.com/lxgw/LxgwWenKai/releases/download/v1.522/LXGWWenKai-Regular.ttf>
- 许可证：SIL Open Font License 1.1，原文保存在本目录的 [`OFL.txt`](./OFL.txt)
- 许可证原文来源：<https://raw.githubusercontent.com/lxgw/LxgwWenKai/v1.522/OFL.txt>
- 下载日期：2026-09-28

只将「芽」和「谱」两个字的轮廓写入 SVG；TTF 留在本地生成目录，不随项目分发。

## 重建

安装有 `fontTools` 的 Python 3 环境后运行：

```powershell
python scripts/brand/outline-wordmark.py --font E:/Projects/.tmp/codex2/fonts/LXGWWenKai-Regular.ttf
```

脚本会重建 `mark.svg`、`logo.svg` 和 `public/favicon.svg`。本次运行环境未提供 fontTools，因此没有安装依赖；已使用 Windows GDI+ 从同一份官方 TTF 提取字形轮廓。需要重新生成时，请在已安装 fontTools 的 Python 环境运行上述脚本。
