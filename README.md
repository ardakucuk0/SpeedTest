```markdown
# SpeedTest Project

A lightweight browser‑based internet speed test tool built with **HTML**, **JavaScript**, and **PHP**.  
It measures **ping**, **download speed**, and **upload speed**, and displays results in real time with animated gauges and a summary panel.

---

## 🚀 Features

- **Ping measurement** with jitter calculation
- **Download test** using randomized data streams
- **Upload test** using generated blobs
- **Live gauges** for download and upload speeds
- **Summary panel** showing ping, speeds, duration, and total data transferred
- **Responsive design** with light/dark mode support

---

## 📂 Project Structure

```
project-root/
├── index.html             # Main UI page
├── script.js              # UI orchestration, gauges, summary logic
├── speedtest.js           # Web Worker: ping, download, upload tests
└── php/
    ├── pingsetc.php       # Ping endpoint (responds quickly, no cache)
    └── upload_download.php# Download endpoint (streams random data)
```

---

## ⚙️ Requirements

- A local or remote web server with **PHP** enabled (Apache, Nginx, etc.)
- Modern browser (Chrome recommended) with Web Worker support
- Network access to the server hosting the PHP endpoints

---

## 🔧 Setup Instructions

1. Place all files in your web server’s document root (or a subdirectory).
2. Ensure the `php/` folder is accessible and PHP is enabled.
3. Open `index.html` in your browser via the server URL, e.g.:

   ```
   http://localhost/index.html
   ```

4. The app will initialize automatically and show the **Start** button.

---

## 🖥️ Usage

- Click **Start** to begin the test.
- The app runs **Download → Ping → Upload** in sequence.
- Gauges animate live during the test.
- When finished, the **Summary** panel displays:
  - Ping (ms)
  - Download speed (Mbit/s)
  - Upload speed (Mbit/s)
  - Duration (seconds)
  - Data used (MB for download, upload, and total)

- Click **Abort** while running to stop the test early.
