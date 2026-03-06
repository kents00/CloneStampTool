# CloneStampApp

A web-based image editing tool built with ASP.NET Core MVC that mimics the classic "Clone Stamp" functionality found in professional photo editing software.

## Features

- **Image Upload:** Load any local image onto a dynamic HTML5 Canvas.
- **Clone Stamp Tool:** 
  - `Shift+Click` to set a source pixel anchor point.
  - Click and drag to clone pixels from the source area to the target area.
- **Customizable Brush:**
  - Adjust brush **Size** dynamically.
  - Adjust brush **Hardness** (soft edges using radial gradients).
  - Modern circle cursor tracks your brush size directly on the canvas.
- **History Management:** Fully functional `Undo` (`Ctrl+Z`) and `Redo` (`Ctrl+Y` or `Ctrl+Shift+Z`) shortcuts for the canvas.
- **Save & Export:** Download your cloned creation as a `.png` file.
- **Reset:** Quickly clear all edits and revert to the originally uploaded image.
- **Modern UI:** Built with dark-mode friendly styling, glassmorphism elements, CSS animations, and interactive toast notifications.

## Architecture & Technologies

This application uses the **MVC (Model-View-Controller)** pattern:

*   **Backend:** C# / .NET 8
*   **Web Framework:** ASP.NET Core MVC
*   **Frontend UI:** Razor Pages (`.cshtml`), Vanilla CSS, Bootstrap (for underlying layout grids), FontAwesome icons.
*   **Frontend Logic:** Vanilla Javascript with HTML5 `<canvas>` API for complex pixel manipulation and image data processing.

### Key Files

- `Views/Home/Index.cshtml`: The main workspace layout containing the toolbar, sliders, and canvas area.
- `wwwroot/css/site.css`: Contains the application's design system (dark mode colors, animations, glass panels).
- `wwwroot/js/site.js`: The brain of the frontend. It calculates mouse distances, manages the undo/redo stack, handles the secondary brush canvas masking, and processes the clone stamp math.

## Getting Started

### Prerequisites

- [.NET 8.0 SDK](https://dotnet.microsoft.com/en-us/download/dotnet/8.0) or later.
- An IDE such as [Visual Studio 2022](https://visualstudio.microsoft.com/) or [VS Code](https://code.visualstudio.com/).

### Running Locally

1. Open your terminal and navigate to the root directory `CloneStampApp`.
2. Run the application using the .NET CLI:
   ```bash
   dotnet run
   ```
3. The application will start. Open your browser and navigate to the URL provided in the console output (usually `http://localhost:5109`).

## Usage Guide

1. Click **Upload** and select an image from your computer.
2. Hold `Shift` on your keyboard and `Left-Click` anywhere on the image to set the source area you want to copy from. A toast notification will confirm the source is set.
3. Move your mouse to the area you want to stamp over. 
4. `Click and drag` to start painting the cloned pixels over your image.
5. Use the Brush settings in the left toolbar to change the size or softness of the stamp.
6. Once finished, click the **Download** button to save your final `cloned-image.png`.

## License

This project was built for educational purposes. Feel free to use and modify the code!
