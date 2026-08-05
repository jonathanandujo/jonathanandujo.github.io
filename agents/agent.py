from agency import Agent, tool
import openai
from tools import browse

# LM Studio
openai.api_key = "lm-studio"
openai.base_url = "http://localhost:1234/v1"

@tool
def open_page(url: str) -> str:
    """Abre una página web y devuelve el HTML."""
    return browse(url)

agent = Agent(
    name="AgencyCustom",
    instructions="Eres un agente que puede navegar la web usando la herramienta open_page.",
    tools=[open_page]
)
