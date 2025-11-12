# ⚡ SpeedTest Project  

A lightweight **browser‑based Internet speed test** built with **HTML**, **JavaScript**, and **PHP**.  
It measures **Ping**, **Download speed**, and **Upload speed**, with real‑time gauges and a summary panel.  

---

## ✨ Features  

- 📡 **Ping measurement** with jitter calculation  
- ⬇️ **Download test** using randomized data streams  
- ⬆️ **Upload test** using generated blobs  
- 🎛️ **Animated gauges** for live speed visualization  
- 📊 **Summary panel** with ping, speeds, duration, and data usage  


---

## 📂 Project Structure

```
.
├── index.html              # Main UI page
├── script.js               # UI orchestration, gauges, summary logic
├── speedtest.js            # Web Worker: ping, download, upload tests
└── php/
    ├── pingsetc.php        # Ping endpoint (responds quickly, no cache)
    └── upload_download.php # Download endpoint (streams random data)
```


## ⚙️ Requirements  

- Local or remote web server with **PHP** enabled (Apache, Nginx, etc.)  
- Modern browser (Chrome recommended) with Web Worker support  
- Network access to the server hosting the PHP endpoints  

---

## 🌍 Test Server  

We provide a public test server:  

**http://194.105.5.210**  

- Accessible from **Mobile** and **Desktop**  
- Hosted in **Türkiye** on a budget‑friendly plan (performance may be slightly lower than high‑end servers)  
- Code runs smoothly on high‑end servers too, giving correct results  

---

## 🚀 Setup  

1. Clone this repository:  
   ```bash
   git clone https://github.com/ardakucuk0/SpeedTest
   ```
2. Place files in your web server’s document root (or a subdirectory).  
3. Ensure the `php/` folder is accessible and PHP is enabled.  
4. Open in browser:  
   ```bash
   http://localhost/index.html
   ```

---

## 🖥️ Usage  

- Click **Start** to begin the test.  
- The app runs **Download → Ping → Upload** in sequence.  
- Gauges animate live during the test.  
- When finished, the **Summary** panel displays:  
  - Ping (ms)  
  - Download speed (Mbps)  
  - Upload speed (Mbps)  
  - Duration (seconds)  
  - Data used (MB for download, upload, and total)  
 

---

## 🖥️ Hosting on Windows with XAMPP  

To run the project locally on a Windows PC:  

1. **Download & Install XAMPP**  
   - Get it from [https://www.apachefriends.org](https://www.apachefriends.org).  
   - Install with default settings.  

2. **Start Apache**  
   - Open the XAMPP Control Panel.  
   - Click **Start** next to **Apache**.  

3. **Place Project Files**  
   - Copy the project folder into:  
     ```
     C:\xampp\htdocs\
     ```  

4. **Access in Browser**  
   - Open:  
     ```
     http://localhost/
     ```

     ## 📘 Lessons Learned

We first deployed an earlier version of our speed test on https://speedtest-ardalara2025.fly.dev, but it did not perform as expected. The machines were hosted in the United States while we were testing from Türkiye, which caused high latency and very low measured speeds. In addition, the CSS-based interface broke during deployment and displayed inconsistently compared to our local version.

For the version we are submitting now, we addressed these issues by deploying servers closer to our region, improving test logic with parallel data streams and larger payloads, and rebuilding the interface with cleaner HTML and stable CSS for consistent performance and appearance.

---

