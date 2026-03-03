import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

class Config:
    GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
    MODEL_NAME = "gemini-2.5-flash"  # Default model, can be overridden

    @staticmethod
    def get_gemini_config():
        """Returns the configuration for AutoGen to use Gemini."""
        if not Config.GOOGLE_API_KEY:
            raise ValueError("GOOGLE_API_KEY environment variable not set.")
        
        # Configure the genai library (though AutoGen might handle this differently depending on version,
        # it's good practice to have it ready or use it for direct calls if needed)
        genai.configure(api_key=Config.GOOGLE_API_KEY)

        return {
            "config_list": [
                {
                    "model": "gemini-2.5-flash", # Using flash for speed/cost in this demo, or pro
                    "api_key": Config.GOOGLE_API_KEY,
                    "api_type": "google"
                }
            ],
            "temperature": 0.7,
        }
