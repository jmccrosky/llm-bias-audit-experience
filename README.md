# LLM Bias Audit Experience

## Installation

 - Ensure Node.js and NPM are installed on your machine
 - Clone this repo: `git clone https://github.com/jmccrosky/llm-bias-audit-experience.git`
 - From the repo directory, run `npm install`

 ## Running

 - From the repo directory run `node server.js <LLM-SERVER-IP>`
 - You can then see the gallery from your web broswer at http://localhost/gallery.html and the interactive interface at http://localhost/

## LLM server

This currently requires the LLM (probably llava) to be served locally, twice.

 - Using ollama on port 11434
 - Using llamafile on port 1234

 I used ollama as it support the more convenient `chat/completions` endpoint.   But it does not support the `logit_bias` parameter, which I need for one call, so use llamafile for that.
