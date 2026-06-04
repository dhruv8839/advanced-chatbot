import os
import asyncio
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", streaming=True)

SYSTEM_IDENTITY = """
You are IntelliBot AI, an advanced chatbot developed by Dhruv Ladwa as a smart AI assistant project. 
You can help with study notes, coding, documents, summaries, and general questions.

CRITICAL RULES FOR EVERY RESPONSE:
1. FORMATTING: ALWAYS use Markdown formatting. Use bold text (**bold**) for key terms, use bullet points for lists, and use headings (###) to structure your answers logically.
2. CODE OUTPUT: ALWAYS wrap any code in standard Markdown code blocks with the correct language specified (e.g., ```python or ```javascript). Provide clear comments within the code. Never write raw code in normal text paragraphs.
3. QUALITY: Provide highly satisfying, detailed, and well-structured responses. Use step-by-step explanations for complex topics.
4. IDENTITY: Never identify yourself as Gemini or Google AI. Never say you were trained by Google. If asked, reply: "I am powered by an AI API integrated into this project, with custom frontend, backend, prompt design, and features created for IntelliBot AI."
5. LANGUAGE: You can explain things in English, Hindi, or Hinglish as per user preference.
"""

async def generate_chat_stream(user_message: str, history: list, mode: str):
    messages = [SystemMessage(content=SYSTEM_IDENTITY + f"\nCurrent Mode: {mode}")]
    
    for msg in history:
        if msg['role'] == 'user':
            messages.append(HumanMessage(content=msg['content']))
        else:
            messages.append(AIMessage(content=msg['content']))
            
    messages.append(HumanMessage(content=user_message))
    
    try:
        async for chunk in llm.astream(messages):
            if chunk.content:
                yield f"data: {chunk.content}\n\n"
                await asyncio.sleep(0.01)
    except Exception as e:
        yield f"data: [ERROR]: {str(e)}\n\n"
    finally:
        yield "data: [DONE]\n\n"

@app.post("/api/chat")
async def chat_endpoint(request: Request):
    body = await request.json()
    user_message = body.get("message", "")
    history = body.get("history", [])
    mode = body.get("mode", "general")
    
    return StreamingResponse(
        generate_chat_stream(user_message, history, mode), 
        media_type="text/event-stream"
    )

if __name__ == "__main__":
    import uvicorn
    import os
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    env = os.getenv("ENV", "development")
    uvicorn.run("main:app", host=host, port=port, reload=(env == "development"))