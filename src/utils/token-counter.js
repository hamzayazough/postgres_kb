const { Tiktoken } = require("@dqbd/tiktoken");
const cl100k_base = require("@dqbd/tiktoken/encoders/cl100k_base.json");
const encoder = new Tiktoken(
  cl100k_base.bpe_ranks,
  cl100k_base.special_tokens,
  cl100k_base.pat_str
);

function countTokens(text) { 
  return encoder.encode(text).length;
}

module.exports = { countTokens };
