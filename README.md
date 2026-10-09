# 📄 Image to PDF Maker (PicToPdf)

> A fast, modern, and **100% private** client-side web application that converts images (JPG, PNG, WebP, BMP) into customized, high-quality PDF documents directly in your browser.

![Status](https://img.shields.io/badge/Status-Active-brightgreen)
![Privacy](https://img.shields.io/badge/Privacy-100%25%20Client--Side-blue)
![License](https://img.shields.io/badge/License-MIT-purple)
![Responsive](https://img.shields.io/badge/Responsive-Mobile%20%26%20Desktop-orange)

---

## 🌟 Key Features

- **🔒 100% Private & Secure**:
  - No files are uploaded to any server or external cloud service.
  - All image processing and PDF creation happen purely inside your browser.
- **📁 Multi-format Image Support**:
  - Accepts **JPG, JPEG, PNG, WebP, and BMP**.
  - Drag-and-drop multiple images simultaneously or browse via file picker.
- **🔄 Drag-and-Drop Page Reordering**:
  - Effortlessly reorder pages by dragging cards using [SortableJS](https://sortablejs.github.io/Sortable/).
- **✂️ Advanced Image Cropping & Editing**:
  - Interactive manual cropping with preset aspect ratios: **Free, 1:1, 4:3, 16:9, and A4**.
  - **Auto Crop**: Smart document edge/border detection to trim photo borders automatically.
- **🔁 90° Image Rotation**:
  - Rotate any individual page clockwise (90°, 180°, 270°, 360°) with instant thumbnail update.
- **📄 Flexible Page Sizes**:
  - **A4** (210 × 297 mm)
  - **US Letter** (8.5 × 11 in)
  - **Fit (Match Image Size)** — creates a custom page size matching each image's native resolution.
- **📐 Orientation Control**:
  - Choose between **Portrait**, **Landscape**, or **Auto** (adjusts each page orientation automatically based on the image's aspect ratio).
- **📏 Customizable Margins**:
  - Options: **None (0 pt)**, **Small (18 pt)**, or **Big (36 pt)**.
- **🗜️ Quality & Compression Settings**:
  - **Original Quality (100%)**: Maximum clarity.
  - **Compressed (80%)**: Balanced file size for email sharing.
  - **Maximum Compression (60%)**: Smallest file size for tight upload limits.
- **👁️ Live PDF Preview**:
  - Preview the generated PDF document inside an embedded modal viewer before downloading.
- **📝 Custom Output File Naming**:
  - Easily specify your desired output filename before downloading.

---

## 🛠️ Tech Stack & Libraries

- **HTML5 & CSS3** — Semantic markup and modern styling.
- **[Tailwind CSS](https://tailwindcss.com)** — Utility-first, responsive user interface.
- **Vanilla JavaScript (ES6+)** — Fast, lightweight, zero framework overhead.
- **[PDF-Lib](https://pdf-lib.js.org/)** — High-performance client-side PDF document generation.
- **[Cropper.js](https://fengyuanchen.github.io/cropperjs/)** — Visual image cropping with aspect-ratio locking.
- **[SortableJS](https://sortablejs.github.io/Sortable/)** — Touch and mouse drag-and-drop grid sorting.
- **[Lucide Icons](https://lucide.dev/)** — Clean, modern icon set.

---

## 📂 Project Structure

```text
PicToPdf/
│
├── index.html            # Main application HTML file
├── README.md             # Project documentation
│
├── css/
│   ├── cropper.min.css   # Cropper.js styling
│   └── styles.css        # Custom styles, transitions, and scrollbars
│
└── js/
    ├── app.js            # Core application logic & PDF processing
    ├── cropper.min.js    # Image cropper library
    ├── lucide.min.js     # Icons library
    ├── pdf-lib.min.js    # PDF generation library
    └── sortable.min.js   # Drag-and-drop sorting library
```

---

## 🚀 How to Run Locally

You do **not** need to install Node.js, databases, or backend servers. The app runs completely offline in any modern web browser.

### Option 1: Direct File Open
Simply double-click `index.html` or right-click and select **Open with > Google Chrome / Microsoft Edge / Firefox / Safari**.

### Option 2: Using a Local Development Server (Recommended)
Running through a local web server ensures optimal performance and eliminates local file protocol (`file://`) browser restrictions:

- **VS Code Live Server**:
  1. Open the project folder in VS Code.
  2. Right-click `index.html` and choose **"Open with Live Server"**.

- **Python HTTP Server**:
  ```bash
  # Python 3
  python -m http.server 8000
  ```
  Then navigate to `http://localhost:8000` in your web browser.

- **Node.js `serve` / `npx`**:
  ```bash
  npx serve .
  ```

---

## 📖 How to Use

1. **Upload Images**:
   - Drag and drop your image files onto the upload area, or click **Browse** to select files.
2. **Organize & Edit**:
   - **Reorder**: Drag any image card to change its position in the PDF.
   - **Rotate**: Click the rotate icon (`⟳`) on any card to rotate it 90 degrees.
   - **Crop**: Click the crop icon to launch the cropping tool. Choose a ratio or click **Auto Crop**.
   - **Delete**: Click the trash icon to remove an individual image.
3. **Configure Settings**:
   - Select page size (A4, Letter, Fit), orientation (Portrait, Landscape, Auto), and margin.
   - Pick the desired image compression level and type your custom file name.
4. **Generate & Download**:
   - Click **Review / Preview PDF** to verify pages and layout in the built-in viewer.
   - Click **Create PDF** (or **Download**) to save your new PDF document instantly!

---

## 🔐 Privacy & Security

Your privacy is paramount. Unlike online converter tools that upload confidential images (such as ID cards, passports, contracts, or personal photos) to remote servers:
- **No data is uploaded or transmitted anywhere**.
- All image manipulations and canvas computations run on your device's memory.
- You can even disconnect your internet after loading the page and the tool will continue working perfectly!

---

## 🌐 Browser Compatibility

Tested and fully supported on:
- Google Chrome (Version 80+)
- Microsoft Edge (Chromium-based)
- Mozilla Firefox (Version 78+)
- Apple Safari (Version 14+)
- Opera and other Chromium-based browsers

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE). Feel free to use, modify, and distribute it.

