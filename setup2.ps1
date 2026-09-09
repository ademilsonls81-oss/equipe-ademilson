# ==================================================
# SETUP SCRIPT PARTE 2 - Estilos e Componentes
# ==================================================

$ErrorActionPreference = "Stop"
$base = $PSScriptRoot

function Write-File($rel, $content) {
    $path = Join-Path $base $rel
    $dir = Split-Path $path -Parent
    if (!(Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
    [System.IO.File]::WriteAllText($path, $content, [System.Text.UTF8Encoding]::new($false))
    Write-Host "  OK: $rel"
}

Write-Host "`n== Criando estilos e componentes ==`n"

# ---- globals.css ----
Write-File "src/app/globals.css" @'
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Outfit:wght@400;600;700;800;900&display=swap");

:root {
  --navy: #0a0f2c;
  --navy-mid: #121a3e;
  --navy-light: #1a2355;
  --gold: #d4a017;
  --gold-light: #f0c040;
  --gold-pale: #fff3c4;
  --white: #ffffff;
  --off-white: #f0f4ff;
  --text-muted: #94a3b8;
  --text-body: #cbd5e1;
  --success: #22c55e;
  --error: #ef4444;
  --border: rgba(212,160,23,0.2);
  --glass: rgba(255,255,255,0.04);
  --glass-border: rgba(255,255,255,0.08);
  --radius: 12px;
  --radius-lg: 20px;
  --shadow-gold: 0 0 30px rgba(212,160,23,0.15);
  --shadow-card: 0 4px 24px rgba(0,0,0,0.4);
}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body {
  font-family: "Inter", sans-serif;
  background: var(--navy);
  color: var(--text-body);
  line-height: 1.6;
  overflow-x: hidden;
}
h1,h2,h3,h4,h5,h6 { font-family: "Outfit", sans-serif; color: var(--white); line-height: 1.2; }
a { color: inherit; text-decoration: none; }
img { max-width: 100%; display: block; }
button { cursor: pointer; border: none; outline: none; font-family: inherit; }
input, select, textarea { font-family: inherit; }

/* Scrollbar */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: var(--navy); }
::-webkit-scrollbar-thumb { background: var(--gold); border-radius: 3px; }

/* Utilities */
.container { max-width: 1100px; margin: 0 auto; padding: 0 20px; }
.section { padding: 80px 0; }
.section-tag {
  display: inline-block;
  background: rgba(212,160,23,0.15);
  color: var(--gold);
  border: 1px solid rgba(212,160,23,0.3);
  border-radius: 20px;
  padding: 6px 16px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-bottom: 16px;
}
.section-title {
  font-size: clamp(28px,5vw,42px);
  font-weight: 800;
  color: var(--white);
  margin-bottom: 16px;
}
.section-title span { color: var(--gold); }
.section-subtitle {
  font-size: 17px;
  color: var(--text-muted);
  max-width: 600px;
  line-height: 1.7;
}
.text-center { text-align: center; }
.text-center .section-subtitle { margin: 0 auto; }

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  border-radius: var(--radius);
  font-size: 16px;
  font-weight: 700;
  transition: all 0.25s ease;
  white-space: nowrap;
}
.btn-primary {
  background: linear-gradient(135deg, var(--gold), var(--gold-light));
  color: var(--navy);
}
.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(212,160,23,0.4); }
.btn-outline {
  background: transparent;
  color: var(--white);
  border: 2px solid rgba(255,255,255,0.25);
}
.btn-outline:hover { border-color: var(--gold); color: var(--gold); transform: translateY(-2px); }
.btn-whatsapp {
  background: #25d366;
  color: #fff;
  font-size: 17px;
  padding: 16px 32px;
  border-radius: var(--radius-lg);
  box-shadow: 0 4px 20px rgba(37,211,102,0.3);
}
.btn-whatsapp:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(37,211,102,0.45); }

/* Cards */
.card {
  background: var(--glass);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: 28px;
  backdrop-filter: blur(10px);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}
.card:hover { transform: translateY(-4px); box-shadow: var(--shadow-card); }

/* Gradient text */
.gradient-text {
  background: linear-gradient(135deg, var(--gold), var(--gold-light));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Badge free */
.badge-free {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(34,197,94,0.12);
  border: 1px solid rgba(34,197,94,0.3);
  color: #4ade80;
  border-radius: 20px;
  padding: 8px 18px;
  font-size: 14px;
  font-weight: 700;
  animation: pulse-badge 2.5s ease-in-out infinite;
}
@keyframes pulse-badge {
  0%,100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.3); }
  50% { box-shadow: 0 0 0 8px rgba(34,197,94,0); }
}

/* Fade in animation */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
}
.fade-up { animation: fadeUp 0.6s ease both; }
.delay-1 { animation-delay: 0.1s; }
.delay-2 { animation-delay: 0.2s; }
.delay-3 { animation-delay: 0.3s; }
.delay-4 { animation-delay: 0.4s; }

/* Divider */
.divider { height: 1px; background: linear-gradient(90deg, transparent, var(--border), transparent); margin: 0; }

/* Form */
.form-group { display: flex; flex-direction: column; gap: 8px; }
.form-label { font-size: 14px; font-weight: 600; color: var(--off-white); }
.form-input, .form-select {
  background: rgba(255,255,255,0.06);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius);
  padding: 13px 16px;
  color: var(--white);
  font-size: 15px;
  transition: border-color 0.2s;
  width: 100%;
}
.form-input:focus, .form-select:focus {
  outline: none;
  border-color: var(--gold);
  background: rgba(255,255,255,0.09);
}
.form-select option { background: var(--navy-mid); color: var(--white); }
.form-input::placeholder { color: var(--text-muted); }
.form-input.error, .form-select.error { border-color: var(--error); }

/* Checkbox */
.checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  cursor: pointer;
  font-size: 14px;
  color: var(--text-body);
  line-height: 1.5;
}
.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  min-width: 18px;
  margin-top: 2px;
  accent-color: var(--gold);
  cursor: pointer;
}

/* Responsive */
@media (max-width: 768px) {
  .section { padding: 60px 0; }
  .hide-mobile { display: none !important; }
}
@media (max-width: 480px) {
  .section { padding: 48px 0; }
  .container { padding: 0 16px; }
}
'@

Write-Host "  OK: globals.css"
Write-Host "`n== Estilos criados! ==`n"
