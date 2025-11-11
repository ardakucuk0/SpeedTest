# 🌐 Speed Test Web App

A lightweight browser-based internet speed test built with HTML, CSS, JavaScript, and PHP. It measures your network's ping latency, download speed, and upload speed in real time — no external dependencies or APIs required.

---

## 🚀 Features

- 📡 **Ping Test**: Measures round-trip latency to the server
- ⬇️ **Download Test**: Streams data from the server to measure throughput
- ⬆️ **Upload Test**: Sends data to the server to measure upload speed
- 📊 **Live Gauges**: Real-time updates for each metric
- ✅ **Summary Panel**: Displays final results and total data used

---

## 🖥️ System Requirements

- OS: Windows, macOS, or Linux
- Browser: Any modern browser (Chrome, Firefox, Edge, Safari)
- Local Server: [XAMPP](https://www.apachefriends.org/) or any PHP-enabled web server
- PHP: Version 7.0 or higher

---

## 📦 Installation

1. **Install XAMPP** (or similar local server)
2. **Clone or download** this repository
3. **Place all files** into your `htdocs` directory (e.g., `C:\xampp\htdocs/speedtest`)
4. Start **Apache** from the XAMPP control panel
5. Visit `http://localhost/speedtest` in your browser

---

## ▶️ Usage

1. Click **Start Test**
2. Watch the gauges update in real time:
   - Ping runs for 3 seconds
   - Download runs for 2 seconds
   - Upload runs for 2 seconds
3. View the final summary including:
   - Average ping
   - Download and upload speeds
   - Total data transferred

---

## 📁 File Overview

| File           | Purpose                                                                 |
|----------------|-------------------------------------------------------------------------|
| `index.html`   | Main UI layout and structure                                            |
| `style.css`    | Styling for gauges, buttons, and summary panel                          |
| `script.js`    | Core logic for running ping/download/upload tests and updating the UI   |
| `ping.php`     | Responds to ping requests to measure latency                            |
| `download.php` | Streams dummy data to simulate download speed                           |
| `upload.php`   | Accepts POST data to simulate upload speed                              |

---

## 📐 How It Works

### Ping Test
- Sends repeated requests to `ping.php`
- Measures round-trip time using `performance.now()`
- Averages results over 3 seconds

### Download Test
- Fetches data from `download.php` using a stream reader
- Measures bytes received over time
- Calculates Mbps using:  
  `Mbps = (bytesReceived * 8) / (elapsedSeconds * 1024 * 1024)`

### Upload Test
- Sends 2MB chunks to `upload.php` via POST
- Measures bytes sent over time
- Calculates Mbps using:  
  `Mbps = (uploadedBytes * 8) / (elapsedSeconds * 1024 * 1024)`
