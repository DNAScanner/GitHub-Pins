type Pin = {
	name: string;
	url: string;
	languages: {
		name: string;
		part: number;
		color: string;
	}[];
};

const pins: Pin[] = [
	/*PINS*/
];

console.log(pins);

// For every pin, create a pie chart using a canvas

let widestChild = 0;

for (const pin of pins) {
	const wrapper = document.createElement("div");
	wrapper.classList.add("pin-wrapper");

	const title = document.createElement("span");
	title.classList.add("pin-title");
	title.textContent = pin.name;
	wrapper.appendChild(title);

	const canvas = document.createElement("canvas");
	const size = 512;
	canvas.width = size;
	canvas.height = size;
	wrapper.appendChild(canvas);

	const ctx = canvas.getContext("2d");

	if (!ctx) continue;
	let start = 0;
	for (const lang of pin.languages) {
		const end = start + lang.part * 2 * Math.PI;

		ctx.beginPath();
		ctx.moveTo(canvas.width / 2, canvas.height / 2);
		ctx.arc(canvas.width / 2, canvas.height / 2, 256, start, end);
		ctx.fillStyle = lang.color;
		ctx.fill();

		start = end;
	}

	const legend = document.createElement("div");
	legend.classList.add("lang-wrapper");
	wrapper.appendChild(legend);

	for (const lang of pin.languages) {
		const entry = document.createElement("div");
		entry.classList.add("lang-entry");
		legend.appendChild(entry);

		const color = document.createElement("div");
		color.classList.add("lang-color");
		color.style.backgroundColor = lang.color;
		entry.appendChild(color);

		const name = document.createElement("span");
		name.classList.add("lang-name");
		name.textContent = lang.name;
		entry.appendChild(name);

		const part = document.createElement("span");
		part.classList.add("lang-part");
		part.textContent = String(Math.floor(lang.part * 1000) / 10) + "%";
		entry.appendChild(part);
	}

	document.body.appendChild(wrapper);

	if (widestChild < wrapper.getBoundingClientRect().width + 10) {
		const wrapperWidth = wrapper.getBoundingClientRect().width;
		const wrapperMargin = parseFloat(getComputedStyle(wrapper).marginLeft) + parseFloat(getComputedStyle(wrapper).marginRight);
		widestChild = wrapperWidth + wrapperMargin;
	}
}

// If there is a url query called "cols" (=> max columns), make the body so wide, that it fits the amount of columns
if (location.search.includes("cols")) document.body.style.width = `calc(${widestChild}px * ${new URLSearchParams(location.search).get("cols")})`;

if (location.search.includes("transparent")) document.body.style.backgroundColor = "transparent";