import { jsPDF } from 'jspdf';

export interface ChartDataItem {
  label: string;
  value: number;
  value2?: number; // for comparative charts like Sales vs Purchases
}

export class ChartExporter {
  // Primary Palette
  private static colors = [
    { r: 17, g: 141, b: 255 },  // Light Blue (#118DFF)
    { r: 18, g: 191, b: 63 },   // Light Green (#12BF3F)
    { r: 79, g: 70, b: 229 },   // Indigo (#4f46e5)
    { r: 230, g: 108, b: 55 },  // Orange (#E66C37)
    { r: 224, g: 64, b: 10 },   // Red-Orange (#E0400A)
    { r: 245, g: 158, b: 11 },  // Amber/Yellow (#f59e0b)
    { r: 166, g: 166, b: 166 }, // Gray (#A6A6A6)
    { r: 13, g: 148, b: 136 },  // Teal (#0d9488)
  ];

  /**
   * Draw a standard bar/column chart directly on PDF
   */
  static drawColumnChart(
    doc: jsPDF,
    x: number,
    y: number,
    width: number,
    height: number,
    data: ChartDataItem[],
    title: string,
    isComparative = false,
    label1 = 'Value 1',
    label2 = 'Value 2'
  ) {
    if (data.length === 0) return;

    doc.saveGraphicsState();

    // Draw background card container
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x, y, width, height, 4, 4, 'FD');

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text(title.toUpperCase(), x + 6, y + 8);

    const chartX = x + 12;
    const chartY = y + 14;
    const chartW = width - 24;
    const chartH = height - 26;

    // Grid baseline
    doc.setDrawColor(241, 245, 249); // slate-100
    doc.setLineWidth(0.3);
    const gridLines = 4;
    for (let i = 0; i <= gridLines; i++) {
      const gy = chartY + (chartH * i) / gridLines;
      doc.line(chartX, gy, chartX + chartW, gy);
    }

    // Determine max value
    let maxVal = 0.1;
    data.forEach(item => {
      maxVal = Math.max(maxVal, item.value, item.value2 || 0);
    });
    // Add 15% padding at top
    maxVal = maxVal * 1.15;

    // Draw bars
    const barSpacingRatio = 0.35;
    const numGroups = data.length;
    const groupWidth = chartW / numGroups;
    const barWidth = isComparative 
      ? (groupWidth * (1 - barSpacingRatio)) / 2 
      : groupWidth * (1 - barSpacingRatio);

    data.forEach((item, index) => {
      const groupX = chartX + index * groupWidth + (groupWidth * barSpacingRatio) / 2;

      if (!isComparative) {
        // Single Bar
        const barH = (item.value / maxVal) * chartH;
        const barY = chartY + chartH - barH;
        const col = this.colors[index % this.colors.length];
        
        doc.setFillColor(col.r, col.g, col.b);
        doc.rect(groupX, barY, barWidth, barH, 'F');

        // Draw Value text on top of bar
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(71, 85, 105); // slate-600
        doc.text(this.formatShortNumber(item.value), groupX + barWidth / 2, Math.max(chartY + 2, barY - 1.5), { align: 'center' });
      } else {
        // Comparative Bars (Side-by-Side)
        const barH1 = (item.value / maxVal) * chartH;
        const barY1 = chartY + chartH - barH1;
        const barH2 = ((item.value2 || 0) / maxVal) * chartH;
        const barY2 = chartY + chartH - barH2;

        const c1 = this.colors[2]; // indigo
        const c2 = this.colors[3]; // orange

        // Bar 1
        doc.setFillColor(c1.r, c1.g, c1.b);
        doc.rect(groupX, barY1, barWidth, barH1, 'F');
        // Bar 2
        doc.setFillColor(c2.r, c2.g, c2.b);
        doc.rect(groupX + barWidth, barY2, barWidth, barH2, 'F');

        // Draw small markers or text values
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6);
        doc.setTextColor(100, 116, 139);
        // Label only if significant room
        if (numGroups <= 6) {
          doc.text(this.formatShortNumber(item.value), groupX + barWidth / 2, Math.max(chartY + 2, barY1 - 1), { align: 'center' });
          doc.text(this.formatShortNumber(item.value2 || 0), groupX + barWidth * 1.5, Math.max(chartY + 2, barY2 - 1), { align: 'center' });
        }
      }

      // X Label
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(148, 163, 184); // slate-400
      const truncatedLabel = item.label.length > 8 ? item.label.substring(0, 7) + '..' : item.label;
      doc.text(truncatedLabel, groupX + (isComparative ? barWidth : barWidth / 2), chartY + chartH + 4, { align: 'center' });
    });

    // Draw axis lines
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.setLineWidth(0.5);
    doc.line(chartX, chartY, chartX, chartY + chartH); // Y-axis
    doc.line(chartX, chartY + chartH, chartX + chartW, chartY + chartH); // X-axis

    // Comparative Legends
    if (isComparative) {
      const legX = x + width - 40;
      const legY = y + 7;

      doc.setFillColor(this.colors[2].r, this.colors[2].g, this.colors[2].b);
      doc.rect(legX, legY, 2.5, 2.5, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(71, 85, 105);
      doc.text(label1, legX + 3.5, legY + 2);

      doc.setFillColor(this.colors[3].r, this.colors[3].g, this.colors[3].b);
      doc.rect(legX + 18, legY, 2.5, 2.5, 'F');
      doc.text(label2, legX + 21.5, legY + 2);
    }

    doc.restoreGraphicsState();
  }

  /**
   * Draw a standard line/area chart directly on PDF
   */
  static drawLineChart(
    doc: jsPDF,
    x: number,
    y: number,
    width: number,
    height: number,
    data: ChartDataItem[],
    title: string,
    isArea = false,
    lineColor = { r: 79, g: 70, b: 229 } // default Indigo
  ) {
    if (data.length === 0) return;

    doc.saveGraphicsState();

    // Container background
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x, y, width, height, 4, 4, 'FD');

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text(title.toUpperCase(), x + 6, y + 8);

    const chartX = x + 12;
    const chartY = y + 14;
    const chartW = width - 24;
    const chartH = height - 26;

    // Draw baseline and grid
    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(0.3);
    const gridLines = 4;
    for (let i = 0; i <= gridLines; i++) {
      const gy = chartY + (chartH * i) / gridLines;
      doc.line(chartX, gy, chartX + chartW, gy);
    }

    // Determine max value
    let maxVal = 0.1;
    data.forEach(item => {
      maxVal = Math.max(maxVal, item.value);
    });
    maxVal = maxVal * 1.15;

    const numPoints = data.length;
    const stepX = chartW / Math.max(1, numPoints - 1);

    // Compute coordinate points
    const points: { px: number; py: number }[] = [];
    data.forEach((item, index) => {
      const px = chartX + index * stepX;
      const py = chartY + chartH - (item.value / maxVal) * chartH;
      points.push({ px, py });
    });

    // If Area: draw filled polygon underneath line
    if (isArea && points.length > 1) {
      doc.saveGraphicsState();
      // Set light transparent color
      doc.setFillColor(lineColor.r, lineColor.g, lineColor.b);
      // Wait, let's use path drawing to make area polygon
      doc.moveTo(chartX, chartY + chartH); // bottom-left
      points.forEach(p => {
        doc.lineTo(p.px, p.py);
      });
      doc.lineTo(points[points.length - 1].px, chartY + chartH); // bottom-right
      doc.lineTo(chartX, chartY + chartH); // close
      // Draw standard in jsPDF:
      // Note: we'll simulate opacity by drawing thin layers or solid light grey if alpha is not fully supported
      doc.setFillColor(238, 242, 255); // very light blue/indigo (indigo-50)
      doc.fill();
      doc.restoreGraphicsState();
    }

    // Draw line
    doc.saveGraphicsState();
    doc.setDrawColor(lineColor.r, lineColor.g, lineColor.b);
    doc.setLineWidth(1.2);
    for (let i = 0; i < points.length - 1; i++) {
      doc.line(points[i].px, points[i].py, points[i + 1].px, points[i + 1].py);
    }
    doc.restoreGraphicsState();

    // Draw small dot markers & labels
    points.forEach((p, idx) => {
      // Small circle
      doc.setFillColor(lineColor.r, lineColor.g, lineColor.b);
      doc.circle(p.px, p.py, 0.8, 'F');

      // Labels (staggered or skipped to avoid clutter)
      if (numPoints <= 8 || idx % 2 === 0 || idx === numPoints - 1) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(5.5);
        doc.setTextColor(148, 163, 184);

        const label = data[idx].label;
        const truncatedLabel = label.length > 8 ? label.substring(0, 7) + '..' : label;
        doc.text(truncatedLabel, p.px, chartY + chartH + 4, { align: 'center' });

        // Value text
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6);
        doc.setTextColor(71, 85, 105);
        doc.text(this.formatShortNumber(data[idx].value), p.px, Math.max(chartY + 2, p.py - 1.5), { align: 'center' });
      }
    });

    // Axis lines
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.5);
    doc.line(chartX, chartY, chartX, chartY + chartH);
    doc.line(chartX, chartY + chartH, chartX + chartW, chartY + chartH);

    doc.restoreGraphicsState();
  }

  /**
   * Draw a beautiful vector donut / pie chart with a clean legend layout
   */
  static drawDonutChart(
    doc: jsPDF,
    x: number,
    y: number,
    width: number,
    height: number,
    data: ChartDataItem[],
    title: string,
    isDonut = true
  ) {
    if (data.length === 0) return;

    doc.saveGraphicsState();

    // Card background
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x, y, width, height, 4, 4, 'FD');

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text(title.toUpperCase(), x + 6, y + 8);

    const cx = x + width * 0.33;
    const cy = y + height * 0.55;
    const radius = Math.min(width, height) * 0.32;

    const totalVal = data.reduce((sum, item) => sum + item.value, 0);

    let startAngle = 0;

    data.forEach((item, index) => {
      const col = this.colors[index % this.colors.length];
      const slicePercentage = totalVal > 0 ? item.value / totalVal : 0;
      const sliceAngle = slicePercentage * 2 * Math.PI;
      const endAngle = startAngle + sliceAngle;

      if (sliceAngle > 0) {
        // Draw filled arc/pie slice segment using trigonometric approximations
        doc.saveGraphicsState();
        doc.setFillColor(col.r, col.g, col.b);
        doc.setDrawColor(255, 255, 255); // slice borders
        doc.setLineWidth(0.5);
        
        doc.moveTo(cx, cy);
        for (let a = startAngle; a <= endAngle; a += 0.04) {
          doc.lineTo(cx + radius * Math.cos(a), cy + radius * Math.sin(a));
        }
        doc.lineTo(cx + radius * Math.cos(endAngle), cy + radius * Math.sin(endAngle));
        doc.lineTo(cx, cy);
        doc.fill();
        doc.restoreGraphicsState();
      }

      startAngle = endAngle;
    });

    // If Donut Chart, draw an inner white circle
    if (isDonut) {
      doc.saveGraphicsState();
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(255, 255, 255);
      doc.circle(cx, cy, radius * 0.52, 'FD');

      // Center summary label
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text(this.formatShortNumber(totalVal), cx, cy - 0.5, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.5);
      doc.setTextColor(100, 116, 139);
      doc.text('TOTAL', cx, cy + 3.5, { align: 'center' });
      doc.restoreGraphicsState();
    }

    // Draw Legends right side
    const legendStartX = x + width * 0.65;
    let legendStartY = y + 15;
    const legendItemHeight = 6.2;

    data.forEach((item, index) => {
      const col = this.colors[index % this.colors.length];
      const pct = totalVal > 0 ? (item.value / totalVal) * 100 : 0;

      // Color bullet
      doc.setFillColor(col.r, col.g, col.b);
      doc.rect(legendStartX, legendStartY, 2.5, 2.5, 'F');

      // Label and value
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(30, 41, 59);
      const truncatedLabel = item.label.length > 12 ? item.label.substring(0, 11) + '..' : item.label;
      doc.text(truncatedLabel, legendStartX + 4, legendStartY + 2.1);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(100, 116, 139);
      doc.text(`${this.formatShortNumber(item.value)} (${pct.toFixed(1)}%)`, legendStartX + 4, legendStartY + 4.8);

      legendStartY += legendItemHeight;
    });

    doc.restoreGraphicsState();
  }

  /**
   * Draw a gauge chart indicating business status or percentage scores
   */
  static drawGaugeChart(
    doc: jsPDF,
    x: number,
    y: number,
    width: number,
    height: number,
    value: number, // 0 to 100
    title: string,
    unit = '%'
  ) {
    doc.saveGraphicsState();

    // Card Container
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x, y, width, height, 4, 4, 'FD');

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text(title.toUpperCase(), x + 6, y + 8);

    const cx = x + width / 2;
    const cy = y + height * 0.72;
    const radius = Math.min(width, height) * 0.38;

    // Draw Gauge Outer Ring (semi-circle from angle PI to 2*PI)
    doc.saveGraphicsState();
    doc.setLineWidth(5);

    // Segment 1: Red (Critical: 0-45)
    doc.setDrawColor(239, 68, 68); // Red
    this.drawArcSegment(doc, cx, cy, radius, Math.PI, Math.PI + (0.45 * Math.PI));

    // Segment 2: Yellow (Marginal: 45-75)
    doc.setDrawColor(245, 158, 11); // Amber
    this.drawArcSegment(doc, cx, cy, radius, Math.PI + (0.45 * Math.PI), Math.PI + (0.75 * Math.PI));

    // Segment 3: Green (Excellent: 75-100)
    doc.setDrawColor(16, 185, 129); // Emerald
    this.drawArcSegment(doc, cx, cy, radius, Math.PI + (0.75 * Math.PI), 2 * Math.PI);

    doc.restoreGraphicsState();

    // Draw Needle
    doc.saveGraphicsState();
    const clampedVal = Math.min(100, Math.max(0, value));
    const angle = Math.PI + (clampedVal / 100) * Math.PI; // angle mapping

    const nx = cx + (radius - 3) * Math.cos(angle);
    const ny = cy + (radius - 3) * Math.sin(angle);

    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(1.5);
    doc.line(cx, cy, nx, ny);

    // Pivot cap
    doc.setFillColor(30, 41, 59);
    doc.circle(cx, cy, 2.5, 'F');
    doc.restoreGraphicsState();

    // Value Labels
    doc.setFont('helvetica', 'black');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text(`${Math.round(value)}${unit}`, cx, cy + 5, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    let scoreStatus = 'STABLE';
    if (value >= 85) scoreStatus = 'EXCELLENT';
    else if (value >= 70) scoreStatus = 'GOOD';
    else if (value >= 50) scoreStatus = 'STABLE';
    else scoreStatus = 'CRITICAL';
    doc.text(scoreStatus, cx, cy + 9, { align: 'center' });

    doc.restoreGraphicsState();
  }

  // Draw smooth arcs for gauge chart
  private static drawArcSegment(doc: jsPDF, cx: number, cy: number, radius: number, startAngle: number, endAngle: number) {
    const segments = 12;
    const step = (endAngle - startAngle) / segments;
    for (let i = 0; i < segments; i++) {
      const a1 = startAngle + i * step;
      const a2 = startAngle + (i + 1) * step;
      doc.line(
        cx + radius * Math.cos(a1),
        cy + radius * Math.sin(a1),
        cx + radius * Math.cos(a2),
        cy + radius * Math.sin(a2)
      );
    }
  }

  // Format shorthand numbers (e.g. 1.2K, 35M)
  private static formatShortNumber(num: number): string {
    if (num === 0) return '0';
    if (Math.abs(num) >= 1e6) {
      return (num / 1e6).toFixed(1) + 'M';
    }
    if (Math.abs(num) >= 1e3) {
      return (num / 1e3).toFixed(1) + 'K';
    }
    return num % 1 === 0 ? num.toString() : num.toFixed(1);
  }
}
