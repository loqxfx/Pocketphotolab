# PocketPhotoLab

A lightweight, browser-based photo editor. The first version focuses on essential adjustments and a simple, distraction-free workflow.

## Features

- Import JPG, PNG and WebP images
- Exposure and contrast adjustments
- Highlights and shadows
- Temperature, saturation and vibrance
- Rotate left and right
- Press-and-hold before comparison
- Export edited images as PNG
- Local processing: photos are not uploaded to a server

## Run locally

No build tools or package installation are required.

1. Download or clone this repository.
2. Open `index.html` in a modern browser.
3. Choose a photo and start editing.

For a local development server, you can also run:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Project structure

- `index.html` - app layout and controls
- `style.css` - responsive dark interface
- `app.js` - image processing and editor interactions

## Privacy

PocketPhotoLab processes selected images in the browser. It does not send images to a server.

## Roadmap

- [ ] Crop tool and aspect-ratio presets
- [ ] Undo and redo history
- [ ] HSL color controls
- [ ] Presets
- [ ] Improved high-resolution export
- [ ] Accessibility and browser testing

## Contributing

Issues and pull requests are welcome. Please describe the change and test it in a current desktop and mobile browser.

## License

MIT. See [LICENSE](LICENSE).
