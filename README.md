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

 ### Installation

  - Install llava llamafile: `wget -O llava.llamafile https://huggingface.co/jartine/llava-v1.5-7B-GGUF/resolve/c0f56bf2e5706a6328dfceb3bf3bc95422db9022/llava-v1.5-7b-q4.llamafile?download=true && chmod +x llava.llamafile`
  - Install ollama: `export OLLAMA_VERSION=0.1.32 && curl -fsSL https://ollama.com/install.sh | sh` (version 0.1.33 is broken for llava)
  - Download the llava model for ollama: `ollama pull llava`

 ### Running

In one screen session:
  - `sudo systemctl stop ollama`
  - `OLLAMA_HOST=0.0.0.0:11434 ollama serve`

In another screen session:
  - `./llava.llamafile --port 1234 --nobrowser -ngl 9999 --host 0.0.0.0`


