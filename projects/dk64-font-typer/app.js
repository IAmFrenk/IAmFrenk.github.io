const MAX_CHARACTERS = 50;
const DEFAULT_TEXT = "GOLDEN BANANA";
const DEFAULT_LETTER_SPACING = 1;
const DEFAULT_SPACE_WIDTH = 4;
const OUTPUT_SCALE = 4;

const SYMBOL_NAME_MAP = {
	".": "dot",
	",": "comma",
	"!": "exclemation_mark",
	"|": "exclemation_mark_reverse",
	"?": "question_mark",
	"/": "slash",
	"\\": "question_mark_reverse",
	":": "double_dot",
	"-": "dash",
	"_": "underscore",
	"'": "apostrophe",
	"&": "and",
	"%": "percentage",
	"*": "infinite",
	"@": "copyright",
	"#": "button_a",
	"$": "button_b",
	"(": "button_l",
	")": "button_r",
	"=": "button_z",
	"+": "button_start",
};

const form = document.querySelector("#typer-form");
const textInput = document.querySelector("#text-input");
const letterSpacingInput = document.querySelector("#letter-spacing-input");
const spaceWidthInput = document.querySelector("#space-width-input");
const characterCount = document.querySelector("#character-count");
const warningMessage = document.querySelector("#warning-message");
const previewCanvas = document.querySelector("#preview-canvas");
const previewWrap = document.querySelector(".canvas-wrap");
const downloadButton = document.querySelector("#download-button");
const context = previewCanvas.getContext("2d");
const imageCache = new Map();

let latestBlobUrl = "";
let latestDownloadName = `${DEFAULT_TEXT}.png`;

function setWarning(message) {
	warningMessage.textContent = message;
}

function updateCharacterCount() {
	const count = Array.from(textInput.value).length;
	characterCount.textContent = `${count} / ${MAX_CHARACTERS} characters`;
	characterCount.classList.toggle("is-over-limit", count > MAX_CHARACTERS);
}

function readPixelInput(input, fallback) {
	const value = Number.parseInt(input.value, 10);
	return Number.isFinite(value) ? value : fallback;
}

function sanitizeFileName(name) {
	return name.replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_");
}

function unique(values) {
	return [...new Set(values.filter(Boolean))];
}

function symbolCandidates(character) {
	const upper = character.toUpperCase();
	const safeCharacter = /^[A-Z0-9]$/.test(upper) ? upper : "";
	const namedCharacter = SYMBOL_NAME_MAP[character] || SYMBOL_NAME_MAP[upper];
	const encodedCharacter = encodeURIComponent(character);

	const candidates = [
		character === "_" && "symbols/underscore.png",
		safeCharacter && `symbols/${safeCharacter}.png`,
		namedCharacter && `symbols/${namedCharacter}.png`,
		character && `symbols/${character}.png`,
		encodedCharacter !== safeCharacter && `symbols/${encodedCharacter}.png`,
	];

	return unique(candidates);
}

function loadImage(src) {
	if (imageCache.has(src)) {
		return imageCache.get(src);
	}

	const imagePromise = new Promise((resolve) => {
		const image = new Image();
		image.onload = () => resolve(image);
		image.onerror = () => resolve(null);
		image.src = src;
	});

	imageCache.set(src, imagePromise);
	return imagePromise;
}

async function loadSymbol(character) {
	for (const candidate of symbolCandidates(character)) {
		const image = await loadImage(candidate);
		if (image) {
			return image;
		}
	}

	return null;
}

function resetPreview() {
	context.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
	previewCanvas.width = 1;
	previewCanvas.height = 1;
	previewWrap.classList.remove("has-preview");
	downloadButton.disabled = true;
	latestDownloadName = `${DEFAULT_TEXT}.png`;

	if (latestBlobUrl) {
		URL.revokeObjectURL(latestBlobUrl);
		latestBlobUrl = "";
	}
}

async function buildLayout(characters, spaceWidth, letterSpacing) {
	const units = [];
	let skippedCharacters = 0;
	let cursorX = 0;
	let minX = 0;
	let maxX = 0;
	let height = 0;
	let previousWasImage = false;

	for (const character of characters) {
		if (character === " ") {
			units.push({ type: "space", width: spaceWidth });
			cursorX += spaceWidth;
			maxX = Math.max(maxX, cursorX);
			previousWasImage = false;
			continue;
		}

		const image = await loadSymbol(character);
		if (image) {
			if (previousWasImage) {
				cursorX += letterSpacing;
			}

			const startX = cursorX;
			const endX = startX + image.naturalWidth;
			units.push({ type: "image", image, x: startX });
			minX = Math.min(minX, startX);
			maxX = Math.max(maxX, endX);
			height = Math.max(height, image.naturalHeight);
			cursorX = endX;
			previousWasImage = true;
		} else {
			skippedCharacters += 1;
		}
	}

	return {
		units,
		skippedCharacters,
		bounds: {
			width: Math.max(1, maxX - minX),
			height: Math.max(1, height),
			minX,
		},
	};
}

function drawLayout(units, bounds) {
	const width = Math.max(1, Math.ceil(bounds.width * OUTPUT_SCALE));
	const height = Math.max(1, Math.ceil(bounds.height * OUTPUT_SCALE));
	previewCanvas.width = width;
	previewCanvas.height = height;
	context.clearRect(0, 0, width, height);
	context.imageSmoothingEnabled = false;

	const offsetX = -bounds.minX * OUTPUT_SCALE;

	for (const unit of units) {
		if (unit.type === "space") {
			continue;
		}

		const drawWidth = unit.image.naturalWidth * OUTPUT_SCALE;
		const drawHeight = unit.image.naturalHeight * OUTPUT_SCALE;
		const x = Math.round(unit.x * OUTPUT_SCALE + offsetX);
		const y = Math.round((height - drawHeight) / 2);
		context.drawImage(unit.image, x, y, drawWidth, drawHeight);
	}
}

function enableDownload(downloadName) {
	latestDownloadName = downloadName;
	downloadButton.disabled = true;
	previewCanvas.toBlob((blob) => {
		if (!blob) {
			downloadButton.disabled = true;
			setWarning("The browser could not create a downloadable PNG.");
			return;
		}

		if (latestBlobUrl) {
			URL.revokeObjectURL(latestBlobUrl);
		}

		latestBlobUrl = URL.createObjectURL(blob);
		downloadButton.disabled = false;
	}, "image/png");
}

async function handleSubmit(event) {
	event.preventDefault();
	setWarning("");
	resetPreview();

	const renderText = textInput.value.length === 0 ? DEFAULT_TEXT : textInput.value;
	const characters = Array.from(renderText);
	if (characters.length <= 0) {
		setWarning("Enter at least 1 character before submitting.");
		return;
	}

	if (characters.length > MAX_CHARACTERS) {
		setWarning(`Use ${MAX_CHARACTERS} characters or fewer.`);
		return;
	}

	const letterSpacing = readPixelInput(letterSpacingInput, DEFAULT_LETTER_SPACING);
	const spaceWidth = readPixelInput(spaceWidthInput, DEFAULT_SPACE_WIDTH);
	const { units, skippedCharacters, bounds } = await buildLayout(characters, spaceWidth, letterSpacing);

	if (units.length === 0) {
		setWarning("No matching PNGs were found for that text.");
		return;
	}

	drawLayout(units, bounds);
	previewWrap.classList.add("has-preview");
	enableDownload(`${sanitizeFileName(renderText)}.png`);

	if (skippedCharacters > 0) {
		setWarning(`${skippedCharacters} character${skippedCharacters === 1 ? "" : "s"} skipped because no matching PNG was found.`);
	}
}

function handleDownload() {
	if (!latestBlobUrl) {
		return;
	}

	const link = document.createElement("a");
	link.href = latestBlobUrl;
	link.download = latestDownloadName;
	link.click();
}

textInput.addEventListener("input", updateCharacterCount);
form.addEventListener("submit", handleSubmit);
downloadButton.addEventListener("click", handleDownload);
updateCharacterCount();
