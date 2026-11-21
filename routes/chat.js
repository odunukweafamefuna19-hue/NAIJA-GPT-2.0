const express = require("express");
const router = express.Router();

const {
  generateChatCompletion
} = require("../services/ai");

router.post("/", async (req, res) => {
  try {
    const { messages, model } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Please enter a message."
      });
    }

    const result = await generateChatCompletion(messages, model);

    res.json({
      success: true,
      reply: result.reply,
      model: result.model
    });

  } catch (error) {
    console.error("AI Error:", error.message);

    res.status(500).json({
      success: false,
      error: error.message || "AI service failed."
    });
  }
});

module.exports = router;
