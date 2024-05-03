import {DOMParser} from "https://deno.land/x/deno_dom@v0.1.45/deno-dom-wasm.ts";
import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";

type Pin = {
	name: string;
	url: string;
	languages: {
		name: string;
		part: number;
		color: string;
	}[];
};

type Cache = {
	username: string;
	lastPinnedHTML: string;
	data: Pin[];
	lastUpdated: number;
};

const cache: Cache[] = [];

try {
	cache.push(...JSON.parse(Deno.readTextFileSync("cache.json")));
} catch {
	null;
}

setInterval(() => Deno.readTextFileSync("cache.json") !== JSON.stringify(cache, null, 6) && Deno.writeTextFileSync("cache.json", JSON.stringify(cache, null, 6)), 1000);

const browser = await puppeteer.launch({
	executablePath: Deno.build.os !== "windows" ? "/usr/bin/chromium-browser" : "C:/Program Files/Google/Chrome/Application/chrome.exe",
});

Deno.serve({port: 8001}, async (req: Request) => {
	const path = new URL(req.url).pathname.split("/").filter((x) => x !== "");
	console.log(path);

	const headers = new Headers();
	headers.set("Access-Control-Allow-Origin", "*");
	headers.set("Access-Control-Allow-Methods", "GET");
	headers.set("Access-Control-Allow-Headers", "Content-Type");

	if (req.method === "GET" && path[0] === "pinned" && path[1] !== undefined && path.length === 2) {
		const username = path[1].trim().toLowerCase();

		const pins = await getPins(username);
		headers.set("Content-Type", "text/html");

		return new Response(Deno.readTextFileSync("embed.html").replace("/*SCRIPT*/", Deno.readTextFileSync("embed.js")).replace("/*PINS*/", JSON.stringify(pins).slice(1, -1)), {headers});
	} else if (req.method === "GET" && path[0] === "raw" && path[1] !== undefined && path.length === 2) {
		headers.set("Content-Type", "application/json");
		return new Response(JSON.stringify(await getPins(path[1].trim())), {headers});
	} else if (req.method === "GET" && path[0] === "image" && path[1] !== undefined && path.length === 2) {
		const username = path[1].trim().toLowerCase();

		const page = await browser.newPage();
		await page.setViewport({width: 8192, height: 8192});
		await page.goto(`http://localhost:8001/pinned/${username}?cols=${new URL(req.url).searchParams.get("cols") || 3}&transparent=true`);
		const image = await (await page.$("body"))?.screenshot({type: "png", omitBackground: true});
		page.close();

		headers.set("Content-Type", "image/png");
		return new Response(image, {headers});
	} else return new Response("Not found", {status: 404});
});

const getPins = async (username: string) => {
	const cached = cache.find((x) => x.username === username);

	if (cached !== undefined && Date.now() - cached.lastUpdated < 1000 * 60) return cached.data;

	console.log("Fetching data for", username);

	const userPage = new DOMParser().parseFromString(await (await fetch("https://github.com/" + username)).text(), "text/html");

	const pins: Pin[] = [];

	const pinElements = Array.from((userPage?.querySelectorAll(".js-pinned-items-reorder-list")[0] as unknown as HTMLOListElement)?.children || []);

	// console.log(pinElements[0].parentElement?.innerHTML);
	if (cached !== undefined && pinElements[0].parentElement?.innerHTML === cached.lastPinnedHTML) return cached.data;

	for (const pin of pinElements) {
		const repoUrl = pin.querySelector("a")?.getAttribute("href");

		const repoPage = new DOMParser().parseFromString(await (await fetch("https://github.com" + repoUrl)).text(), "text/html");

		const langs = Array.from((Array.from(repoPage!.querySelectorAll(".Layout-sidebar > div > div")).find((element) => element.textContent?.includes("Languages")) as unknown as HTMLDivElement)?.querySelector("div > ul")?.children || []).map((lang) => {
			const language = lang.querySelectorAll("span")[0]?.textContent?.trim();
			const part = Math.round(Number(lang.querySelectorAll("span")[1]?.textContent?.trim().replaceAll("%", "")) * 10) / 1000;
			const color = (
				lang
					.querySelector("svg")
					?.getAttribute("style")
					?.match(/color:(.+);/)?.[1] || "#000000"
			)?.toUpperCase();

			return {name: language, part, color};
		}) as unknown as Pin["languages"];

		pins.push({
			name: repoUrl?.split("/").pop() || "",
			url: "https://github.com" + repoUrl,
			languages: langs,
		});
	}

	if (cached !== undefined) {
		cached.data = pins;
		cached.lastUpdated = Date.now();
	} else
		cache.push({
			username,
			lastPinnedHTML: pinElements[0].parentElement?.innerHTML || "",
			data: pins,
			lastUpdated: Date.now(),
		});

	return pins;
};
