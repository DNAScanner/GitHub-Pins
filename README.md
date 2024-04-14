# GitHub Pins Overview by DNA

Hey, this is a simple project i made for fun, which displays the pinned repositories of a GitHub user in a simple and clean way

A live version of the project can be found [here](https://gh-pins.dnascanner.de/pinned/dnascanner)

⚠️ **Note:** The page might take a few seconds to load, as it grabs the data right of the github site instead of the API (which doesn't exist unfortunately). This however is due to <u>the server's</u> personal internet connection

## How to use

1. Clone the repository
2. Start the backend

```powershell
deno run -A main.ts
```

3. Open the site in your browser, for example: http://localhost:8001/pinned/DNAScanner and the site should look as following:
![Side example](doc/1.png)

4. Data can also be requested in JSON format, by replacing "pinned" with "raw" in the URL: http://localhost:8001/raw/DNAScanner