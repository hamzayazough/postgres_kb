require("dotenv").config();
const axios = require("axios");

async function getEmbedding(text) {
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/embeddings",
      {
        model: "text-embedding-3-small",
        input: text,
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    return response.data.data[0].embedding;
  } catch (error) {
    console.error("Error generating embedding:", error.response?.data || error.message);
    return Array(1536).fill(0.0);
  }
}

module.exports = { getEmbedding };
