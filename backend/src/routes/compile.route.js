import express from "express";
import axios from "axios";

const router = express.Router();

router.post("/", async (req, res) => {
  const { language, code } = req.body;

  // Map your frontend language names to Piston API versions
  const languageMap = {
    "python": { language: "python", version: "3.10.0" },
    "java": { language: "java", version: "15.0.2" },
    "cpp": { language: "c++", version: "10.2.0" },
  };

  const config = languageMap[language];

  if (!config) {
    return res.status(400).json({ message: "Unsupported language" });
  }

  try {
    const response = await axios.post("https://emkc.org/api/v2/piston/execute", {
      language: config.language,
      version: config.version,
      files: [
        {
          content: code,
        },
      ],
    });

    // Send back the output (stdout) or error (stderr)
    res.json({ output: response.data.run.output });
  } catch (error) {
    console.error("Compilation error:", error);
    res.status(500).json({ message: "Failed to execute code" });
  }
});

export default router;