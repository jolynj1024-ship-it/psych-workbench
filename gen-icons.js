const PNG = require('pngjs').PNG;
const fs = require('fs');
const path = require('path');

function createIcon(size) {
  const png = new PNG({ width: size, height: size });
  const data = png.data;
  const r = size; // 圆角半径

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) << 2;
      // 蓝色圆角矩形 #2D9CDB
      // 检查是否在圆角矩形内
      let inside = true;
      const corner = r * 0.22; // 圆角大小
      // 四个角落检查
      if (x < corner && y < corner) {
        const dx = corner - x, dy = corner - y;
        if (dx * dx + dy * dy > corner * corner) inside = false;
      } else if (x > size - corner && y < corner) {
        const dx = x - (size - corner), dy = corner - y;
        if (dx * dx + dy * dy > corner * corner) inside = false;
      } else if (x < corner && y > size - corner) {
        const dx = corner - x, dy = y - (size - corner);
        if (dx * dx + dy * dy > corner * corner) inside = false;
      } else if (x > size - corner && y > size - corner) {
        const dx = x - (size - corner), dy = y - (size - corner);
        if (dx * dx + dy * dy > corner * corner) inside = false;
      }

      if (inside) {
        data[idx] = 0x2D;     // R
        data[idx + 1] = 0x9C;  // G
        data[idx + 2] = 0xDB;  // B
        data[idx + 3] = 0xFF;  // A
      } else {
        data[idx] = 0;
        data[idx + 1] = 0;
        data[idx + 2] = 0;
        data[idx + 3] = 0; // 透明背景
      }
    }
  }

  // 画白色 "J" 字母（简单的像素画）
  const cx = size / 2, cy = size * 0.48;
  const thickness = Math.max(3, size * 0.12);
  const charSize = size * 0.42;

  // J 的形状：竖线 + 底部弯钩
  function setPixel(px, py, alpha) {
    if (px >= 0 && px < size && py >= 0 && py < size) {
      const idx = (Math.round(py) * size + Math.round(px)) << 2;
      if (data[idx + 3] !== 0) { // 只在蓝色区域上画
        data[idx] = 255;
        data[idx + 1] = 255;
        data[idx + 2] = 255;
        data[idx + 3] = Math.min(255, data[idx + 3] + Math.round(alpha));
      }
    }
  }

  // 绘制粗线条（带抗锯齿）
  function drawThickLine(x0, y0, x1, y1, t) {
    const dist = Math.sqrt((x1 - x0) ** 2 + (y1 - y0) ** 2);
    if (dist === 0) return;
    const steps = Math.max(Math.ceil(dist), 1);
    for (let i = 0; i <= steps; i++) {
      const frac = i / steps;
      const px = x0 + (x1 - x0) * frac;
      const py = y0 + (y1 - y0) * frac;
      // 以 (px,py) 为中心画一个实心圆（粗细=t）
      const radius = t / 2;
      for (let dy = -radius - 1; dy <= radius + 1; dy++) {
        for (let dx = -radius - 1; dx <= radius + 1; dx++) {
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d <= radius) {
            setPixel(px + dx, py + dy, 255);
          } else if (d <= radius + 1) {
            setPixel(px + dx, py + dy, 128); // 抗锯齿边缘
          }
        }
      }
    }
  }

  // J 字母的竖线部分（从顶部偏下开始，到接近底部）
  const jTop = cy - charSize * 0.4;
  const jBottom = cy + charSize * 0.25;
  drawThickLine(cx, jTop, cx, jBottom, thickness);

  // J 的底部弯钩（向左弯曲）
  const hookStartX = cx;
  const hookStartY = jBottom;
  const hookEndX = cx - charSize * 0.28;
  const hookMidY = jBottom + charSize * 0.18;
  drawThickLine(hookStartX, hookStartY, cx, hookMidY, thickness);
  drawThickLine(cx, hookMidY, hookEndX, hookMidY, thickness);

  return png;
}

const outDir = path.join(__dirname, 'public');
[192, 512].forEach(size => {
  const png = createIcon(size);
  const buf = PNG.sync.write(png);
  const fname = `icon-${size}.png`;
  fs.writeFileSync(path.join(outDir, fname), buf);
  console.log(`Generated ${fname} (${buf.length} bytes)`);
});
console.log('Done!');
