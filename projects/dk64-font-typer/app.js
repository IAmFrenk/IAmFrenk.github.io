const MAX_CHARACTERS = 50;
const DEFAULT_LETTER_SPACING = 1;
const DEFAULT_SPACE_WIDTH = 4;

const SYMBOL_NAME_MAP = {
	".": "dot",
	",": ",",
	"!": "!",
	"|": "!_reverse",
	"?": "question_mark",
	"/": "question_mark_reverse",
	":": "double_dot",
	"-": "-",
	"_": "_",
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
	return Number.isFinite(value) && value >= 0 ? value : fallback;
}

function unique(values) {
	return [...new Set(values.filter(Boolean))];
}

function symbolCandidates(character) {
	const upper = character.toUpperCase();
	const safeCharacter = /^[A-Z0-9]$/.test(upper) ? upper : "";
	const namedCharacter = SYMBOL_NAME_MAP[character] || SYMBOL_NAME_MAP[upper];
	const encodedCharacter = encodeURIComponent(character);

	return unique([
		safeCharacter && `symbols/${safeCharacter}.png`,
		namedCharacter && `symbols/${namedCharacter}.png`,
		character && `symbols/${character}.png`,
		encodedCharacter !== safeCharacter && `symbols/${encodedCharacter}.png`,
	]);
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

	if (latestBlobUrl) {
		URL.revokeObjectURL(latestBlobUrl);
		latestBlobUrl = "";
	}
}

async function buildUnits(characters, spaceWidth) {
	const units = [];
	let skippedCharacters = 0;

	for (const character of characters) {
		if (character === " ") {
			units.push({ type: "space", width: spaceWidth });
			continue;
		}

		const image = await loadSymbol(character);
		if (image) {
			units.push({ type: "image", image });
		} else {
			skippedCharacters += 1;
		}
	}

	return { units, skippedCharacters };
}

function measureUnits(units, letterSpacing) {
	let width = 0;
	let height = 0;
	let previousWasImage = false;

	for (const unit of units) {
		if (unit.type === "space") {
			width += unit.width;
			previousWasImage = false;
			continue;
		}

		if (previousWasImage) {
			width += letterSpacing;
		}

		width += unit.image.naturalWidth;
		height = Math.max(height, unit.image.naturalHeight);
		previousWasImage = true;
	}

	return {
		width: Math.max(1, width),
		height: Math.max(1, height),
	};
}

function drawUnits(units, letterSpacing, size) {
	previewCanvas.width = size.width;
	previewCanvas.height = size.height;
	context.clearRect(0, 0, size.width, size.height);
	context.imageSmoothingEnabled = false;

	let x = 0;
	let previousWasImage = false;

	for (const unit of units) {
		if (unit.type === "space") {
			x += unit.width;
			previousWasImage = false;
			continue;
		}

		if (previousWasImage) {
			x += letterSpacing;
		}

		const y = Math.round((size.height - unit.image.naturalHeight) / 2);
		context.drawImage(unit.image, x, y);
		x += unit.image.naturalWidth;
		previousWasImage = true;
	}
}

function enableDownload() {
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

	const characters = Array.from(textInput.value);
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
	const { units, skippedCharacters } = await buildUnits(characters, spaceWidth);

	if (units.length === 0) {
		setWarning("No matching PNGs were found for that text.");
		return;
	}

	const size = measureUnits(units, letterSpacing);
	drawUnits(units, letterSpacing, size);
	previewWrap.classList.add("has-preview");
	enableDownload();

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
	link.download = "dk64-font-typer.png";
	link.click();
}

textInput.addEventListener("input", updateCharacterCount);
form.addEventListener("submit", handleSubmit);
downloadButton.addEventListener("click", handleDownload);
updateCharacterCount();
