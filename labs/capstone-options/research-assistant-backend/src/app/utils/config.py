import os
from dotenv import load_dotenv

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
        # genai.configure(api_key=Config.GOOGLE_API_KEY) # Not used directly here

        return {
            "config_list": [
                {
                    "model": Config.MODEL_NAME,
                    "api_key": Config.GOOGLE_API_KEY,
                    "api_type": "google"
                }
            ],
            "temperature": 0.7,
            "timeout": 120
        }
