# LLM Bias Audit Experience

This currently requires the LLM (probably llava) to be served locally, twice.

 - Using ollama on port 11434
 - Using llamafile on port 1234

 I used ollama as it support the more convenient `chat/completions` endpoint.   But it does not support the `logit_bias` parameter, which I need for one call, so use llamafile for that.
