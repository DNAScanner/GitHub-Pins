import {DOMParser} from "https://deno.land/x/deno_dom@v0.1.45/deno-dom-wasm.ts";

Deno.serve({port: 8001}, async (req: Request) => {
	const path = new URL(req.url).pathname.split("/").filter((x) => x !== "");
	console.log(path);

	const headers = new Headers();
	headers.set("Access-Control-Allow-Origin", "*");
	headers.set("Access-Control-Allow-Methods", "GET");
	headers.set("Access-Control-Allow-Headers", "Content-Type");

	if (req.method === "GET" && path[0] === "pinned" && path[1] !== undefined && path.length === 2) {
		const username = path[1].trim();

		const pins = await getPins(username);
		headers.set("Content-Type", "text/html");

		return new Response(Deno.readTextFileSync("embed.html").replace("/*SCRIPT*/", Deno.readTextFileSync("embed.js")).replace("/*PINS*/", JSON.stringify(pins).slice(1, -1)), {headers});
	} else if (req.method === "GET" && path[0] === "raw" && path[1] !== undefined && path.length === 2) {
		headers.set("Content-Type", "application/json");
		return new Response(JSON.stringify(await getPins(path[1].trim())), {headers});
	} else return new Response("Not found", {status: 404});
});

const getPins = async (username: string) => {
	const userPage = new DOMParser().parseFromString(await (await fetch("https://github.com/" + username)).text(), "text/html");

	type Pin = {
		name: string;
		url: string;
		languages: {
			name: string;
			part: number;
			color: string;
		}[];
	};

	const pins: Pin[] = [];

	for (const pin of Array.from((userPage?.querySelectorAll(".js-pinned-items-reorder-list")[0] as unknown as HTMLOListElement)?.children || [])) {
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

	return pins;
};
