const fs = require('fs');
const { createCanvas } = require('canvas');

const achievements = [
    { id: 'novato', name: 'Novato', colors: ['#4ade80', '#22c55e', '#16a34a'], pattern: 'fresh' },
    { id: 'explorador', name: 'Explorador', colors: ['#3b82f6', '#2563eb', '#1d4ed8'], pattern: 'map' },
    { id: 'conhecedor', name: 'Conhecedor', colors: ['#8b5cf6', '#7c3aed', '#6d28d9'], pattern: 'book' },
    { id: 'completista', name: 'Completista', colors: ['#a855f7', '#9333ea', '#7e22ce'], pattern: 'checklist' },
    { id: 'colecionador', name: 'Colecionador', colors: ['#f59e0b', '#d97706', '#b45309'], pattern: 'star' },
    { id: 'personalizador', name: 'Personalizador', colors: ['#ec4899', '#db2777', '#be185d'], pattern: 'palette' },
    { id: 'coruja', name: 'Coruja', colors: ['#1e293b', '#0f172a', '#334155'], pattern: 'moon' },
    { id: 'lenda', name: 'Lenda', colors: ['#fbbf24', '#f59e0b', '#f97316'], pattern: 'crown' },
];

const size = 256;
const outputDir = 'C:/Users/User/Documents/Projeto Padrão/meu-fansite/assets/conquistas';

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

achievements.forEach(a => {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Base gradient
    const grad = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/1.5);
    a.colors.forEach((c, i) => grad.addColorStop(i / (a.colors.length - 1), c));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    
    // Pattern overlay based on achievement theme
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = 0.15;
    
    switch (a.pattern) {
        case 'fresh': // Novato - leaf/sprout pattern
            drawSprouts(ctx, size);
            break;
        case 'map': // Explorador - compass/map lines
            drawMapLines(ctx, size);
            break;
        case 'book': // Conhecedor - book pages
            drawBookPages(ctx, size);
            break;
        case 'checklist': // Completista - checkmarks grid
            drawCheckGrid(ctx, size);
            break;
        case 'star': // Colecionador - stars
            drawStars(ctx, size);
            break;
        case 'palette': // Personalizador - color swatches
            drawPalette(ctx, size);
            break;
        case 'moon': // Coruja - moon phases
            drawMoonPhases(ctx, size);
            break;
        case 'crown': // Lenda - crown/gold
            drawCrown(ctx, size);
            break;
    }
    
    // Center icon/symbol
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    drawCenterSymbol(ctx, size, a.pattern);
    
    // Vignette
    const vignette = ctx.createRadialGradient(size/2, size/2, size/4, size/2, size/2, size);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.35)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, size, size);
    
    const buffer = canvas.toBuffer();
    if (buffer && buffer.length > 0) {
        fs.writeFileSync(`${outputDir}/${a.id}.webp`, buffer);
        console.log(`Generated ${a.id}.webp`);
    } else {
        // Try data URL fallback
        const dataUrl = canvas.toDataURL('image/webp', 0.85);
        const base64 = dataUrl.split(',')[1];
        if (base64) {
            fs.writeFileSync(`${outputDir}/${a.id}.webp`, Buffer.from(base64, 'base64'));
            console.log(`Generated ${a.id}.webp (via dataURL)`);
        } else {
            console.error(`Failed to generate buffer for ${a.id}`);
        }
    }
});

function drawSprouts(ctx, size) {
    for (let i = 0; i < 12; i++) {
        const x = (size * 0.15) + (i % 4) * (size * 0.22);
        const y = (size * 0.2) + Math.floor(i / 4) * (size * 0.25);
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.ellipse(x, y, 8, 14, -0.3, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawMapLines(ctx, size) {
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(size/2, size/2);
        ctx.lineTo(size/2 + Math.cos(angle) * size * 0.45, size/2 + Math.sin(angle) * size * 0.45);
        ctx.stroke();
    }
    // concentric circles
    for (let r = 40; r < size/2; r += 35) {
        ctx.beginPath();
        ctx.arc(size/2, size/2, r, 0, Math.PI * 2);
        ctx.stroke();
    }
}

function drawBookPages(ctx, size) {
    ctx.fillStyle = '#8b5cf6';
    for (let i = 0; i < 5; i++) {
        const y = size * 0.2 + i * size * 0.12;
        ctx.fillRect(size * 0.25, y, size * 0.5, size * 0.08);
        ctx.fillStyle = '#7c3aed';
    }
}

function drawCheckGrid(ctx, size) {
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 2;
    const cell = size / 5;
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
            const x = col * cell + cell * 0.5;
            const y = row * cell + cell * 0.5;
            ctx.beginPath();
            ctx.moveTo(x - 8, y);
            ctx.lineTo(x, y + 8);
            ctx.lineTo(x + 12, y - 12);
            ctx.stroke();
        }
    }
}

function drawStars(ctx, size) {
    for (let i = 0; i < 20; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const s = 4 + Math.random() * 8;
        ctx.fillStyle = '#fbbf24';
        drawStar(ctx, x, y, s);
    }
}

function drawStar(ctx, x, y, size) {
    const spikes = 5;
    const step = Math.PI / spikes;
    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
        const r = i % 2 === 0 ? size : size / 2;
        const angle = i * step - Math.PI / 2;
        ctx.lineTo(x + Math.cos(angle) * r, y + Math.sin(angle) * r);
    }
    ctx.closePath();
    ctx.fill();
}

function drawPalette(ctx, size) {
    const colors = ['#ec4899', '#22d3ee', '#fbbf24', '#4ade80', '#a855f7', '#f97316'];
    colors.forEach((c, i) => {
        const x = size * 0.2 + (i % 3) * (size * 0.25);
        const y = size * 0.2 + Math.floor(i / 3) * (size * 0.25);
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.roundRect(x, y, 28, 28, 6);
        ctx.fill();
    });
}

function drawMoonPhases(ctx, size) {
    ctx.fillStyle = '#64748b';
    for (let i = 0; i < 5; i++) {
        const x = size * 0.15 + i * (size * 0.2);
        const y = size * 0.5;
        const phase = i / 4;
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, Math.PI * 2);
        ctx.fill();
        // shadow part
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(x - (phase - 0.5) * 15, y, 18, Math.PI/2, -Math.PI/2);
        ctx.fill();
        ctx.fillStyle = '#64748b';
    }
}

function drawCrown(ctx, size) {
    ctx.fillStyle = '#fbbf24';
    const cx = size/2, cy = size/2;
    // crown base
    ctx.fillRect(cx - 50, cy - 10, 100, 20);
    // spikes
    for (let i = 0; i < 5; i++) {
        const x = cx - 40 + i * 20;
        ctx.beginPath();
        ctx.moveTo(x, cy - 10);
        ctx.lineTo(x + 10, cy - 55);
        ctx.lineTo(x + 20, cy - 10);
        ctx.fill();
    }
    // gems
    ctx.fillStyle = '#ec4899';
    for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.arc(cx - 30 + i * 15, cy - 5, 5, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawCenterSymbol(ctx, size, pattern) {
    ctx.save();
    ctx.translate(size/2, size/2);
    
    switch (pattern) {
        case 'fresh':
            ctx.fillStyle = 'rgba(34,197,94,0.9)';
            ctx.beginPath();
            ctx.ellipse(0, 0, 12, 22, -0.3, 0, Math.PI * 2);
            ctx.fill();
            break;
        case 'map':
            ctx.strokeStyle = 'rgba(59,130,246,0.9)';
            ctx.lineWidth = 3;
            for (let i = 0; i < 4; i++) {
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(Math.cos(i * Math.PI/2) * 30, Math.sin(i * Math.PI/2) * 30);
                ctx.stroke();
            }
            break;
        case 'book':
            ctx.fillStyle = 'rgba(139,92,246,0.9)';
            ctx.fillRect(-20, -12, 40, 24);
            ctx.fillStyle = 'rgba(124,58,237,0.9)';
            ctx.fillRect(-18, -10, 36, 4);
            ctx.fillRect(-18, -4, 36, 4);
            ctx.fillRect(-18, 2, 36, 4);
            break;
        case 'checklist':
            ctx.strokeStyle = 'rgba(168,85,247,0.9)';
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(-12, 0);
            ctx.lineTo(-2, 10);
            ctx.lineTo(14, -12);
            ctx.stroke();
            break;
        case 'star':
            ctx.fillStyle = 'rgba(251,191,36,0.9)';
            drawStar(ctx, 0, 0, 22);
            break;
        case 'palette':
            ctx.fillStyle = 'rgba(236,72,153,0.9)';
            ctx.beginPath();
            ctx.roundRect(-18, -18, 36, 36, 6);
            ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.fillRect(-12, -12, 8, 8);
            ctx.fillRect(-2, -12, 8, 8);
            ctx.fillRect(-12, -2, 8, 8);
            break;
        case 'moon':
            ctx.fillStyle = 'rgba(100,116,139,0.9)';
            ctx.beginPath();
            ctx.arc(0, 0, 22, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(30,41,59,0.9)';
            ctx.beginPath();
            ctx.arc(-8, 0, 18, Math.PI/2, -Math.PI/2);
            ctx.fill();
            break;
        case 'crown':
            ctx.fillStyle = 'rgba(251,191,36,0.95)';
            ctx.fillRect(-25, -12, 50, 14);
            for (let i = 0; i < 3; i++) {
                const x = -20 + i * 20;
                ctx.beginPath();
                ctx.moveTo(x, -12);
                ctx.lineTo(x + 10, -42);
                ctx.lineTo(x + 20, -12);
                ctx.fill();
            }
            // gems
            ctx.fillStyle = 'rgba(236,72,153,0.95)';
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.arc(-15 + i * 15, -4, 4, 0, Math.PI * 2);
                ctx.fill();
            }
            break;
    }
    ctx.restore();
}

function drawStar(ctx, x, y, size) {
    const spikes = 5;
    const step = Math.PI / spikes;
    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
        const r = i % 2 === 0 ? size : size / 2;
        const angle = i * step - Math.PI / 2;
        ctx.lineTo(x + Math.cos(angle) * r, y + Math.sin(angle) * r);
    }
    ctx.closePath();
    ctx.fill();
}

console.log('All achievement images generated!');