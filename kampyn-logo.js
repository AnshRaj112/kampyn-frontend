module.exports = (function() {
  const lines = [
    "      =============================================================================================",
    "     ====    ====     ====        ====       ====  =========      ====      ====  ====       ====",
    "    ====   ====     ======      ======     ======  ====  ====      ====    ====   ======     ====",
    "   ====  ====      ==== ====    ======== ========  ====   ====      ====  ====    ========   ====",
    "  =========       ====   ====   ==== ======  ====  ==========        ========     ====  ==== ====",
    " ====  ====      =============  ====  ====   ====  ====                ====       ====   ========",
    "====   ====     ====       ==== ====         ====  ====                ====       ====     ======",
    "===    ====    ====         ========         ====  ====                ====       ====       ====",
    "=============================================================================================",
    "                                        F R O N T E N D   A P P                                    "
  ];

  let output = "\n";
  
  // Cyberpunk Gradient for Frontend: Purple (#a855f7) to Cyan (#06b6d4)
  const r1 = 168, g1 = 85, b1 = 247;
  const r2 = 6, g2 = 182, b2 = 212;

  lines.forEach((line) => {
    let coloredLine = "";
    for (let x = 0; x < line.length; x++) {
      const char = line[x];
      if (char === " ") {
        coloredLine += " ";
        continue;
      }
      
      const ratio = x / 95;
      const r = Math.round(r1 + (r2 - r1) * ratio);
      const g = Math.round(g1 + (g2 - g1) * ratio);
      const b = Math.round(b1 + (b2 - b1) * ratio);
      
      coloredLine += "\x1b[38;2;" + r + ";" + g + ";" + b + "m" + char + "\x1b[0m";
    }
    output += coloredLine + "\n";
  });
  
  return output + "\n";
})();
