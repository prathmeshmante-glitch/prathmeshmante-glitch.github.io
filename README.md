# V.E.R.A. — Voice-First Engineering Command Deck

**Live site:** https://prathmeshmante-glitch.github.io

V.E.R.A. is the interactive portfolio for Prathmesh Mante. It fetches public repository metadata from GitHub and offers browser-based spoken access to a guided portfolio tour and README summaries.

## Visitor experience

1. The visitor starts at a voice authorization overlay.
2. V.E.R.A. requests the demo passphrase by voice.
3. After the passphrase is recognized, the command deck opens.
4. Mission cards can open a guided view that reads public repository metadata and attempts to summarize the README aloud.

## Current implementation

- Static frontend: HTML, CSS, and JavaScript
- Hosting: GitHub Pages
- Live repository metadata: GitHub public REST API
- Speech output: browser Speech Synthesis, preferring a feminine-sounding English voice when available
- Speech input: Web Speech Recognition where supported
- README retrieval: GitHub public REST API

## Important limitations

The passphrase is a front-end demonstration gate, not authentication or security. Browser speech support and voice selection vary by device. GitHub Pages cannot identify the GitHub account of a visitor without a sign-in flow. The current guide uses predefined responses and public repository metadata; a real LLM assistant, verified owner recognition, and persistent cross-page guidance require a secure backend and authentication.

## Links

- [Open V.E.R.A.](https://prathmeshmante-glitch.github.io)
- [Prathmesh's GitHub profile](https://github.com/prathmeshmante-glitch)
- [Public repositories](https://github.com/prathmeshmante-glitch?tab=repositories)
