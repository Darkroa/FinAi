from langchain_core.prompts import ChatPromptTemplate
from langchain.agents import create_tool_calling_agent, AgentExecutor
from langchain_community.tools import Tool
from langchain.memory import ConversationBufferMemory
from loguru import logger

from src.utils.llm import get_llm
from src.analysis.full_analyzer import FullAnalyzer
from src.rag.vector_store import FinancialRAG
from src.ingestion.news_fetcher import NewsFetcher


# ==================== LLM Setup ====================
llm = get_llm(model="grok", temperature=0.7)


# ==================== Components ====================
rag = FinancialRAG()
full_analyzer = FullAnalyzer()
news_fetcher = NewsFetcher()   # Reused across tools


# ==================== Tools ====================
def get_latest_financial_news(query: str = "latest") -> str:
    """Fetch latest financial news."""
    try:
        articles = news_fetcher.run()
        if not articles:
            return "No recent financial news available."

        formatted = [
            f"📰 {a.get('title', 'Untitled')}\n"
            f"Source: {a.get('source', 'Unknown')}\n"
            f"Summary: {a.get('summary', '')[:280]}..."
            for a in articles[:5]
        ]
        return "\n\n".join(formatted)
    except Exception as e:
        logger.error(f"News fetch error: {e}")
        return "Unable to fetch latest news right now."


def full_market_analysis(ticker: str) -> dict:
    """Run complete Grok-powered analysis on a ticker."""
    try:
        articles = news_fetcher.run()
        news_text = "\n\n".join([
            a.get("full_text", a.get("summary", "")) 
            for a in articles
        ])

        result = full_analyzer.analyze(ticker, news_text)
        return result.to_dict()
    except Exception as e:
        logger.error(f"Full analysis failed for {ticker}: {e}", exc_info=True)
        return {
            "error": str(e),
            "ticker": ticker,
            "overall_signal": "Neutral",
            "summary": "Analysis could not be completed due to an error."
        }


def retrieve_relevant_context(query: str) -> str:
    """Search historical context from RAG."""
    try:
        results = rag.similarity_search(query)
        if not results:
            return "No relevant historical context found."
        
        formatted = [
            f"{i}. {doc.get('content', doc.get('text', ''))[:400]}..."
            for i, doc in enumerate(results[:4], 1)
        ]
        return "\n\n".join(formatted)
    except Exception as e:
        logger.error(f"RAG retrieval error: {e}")
        return "Could not retrieve historical context."


tools = [
    Tool(
        name="get_latest_financial_news",
        func=get_latest_financial_news,
        description="Get the most recent financial news across markets."
    ),
    Tool(
        name="full_market_analysis",
        func=full_market_analysis,
        description="Run complete Grok-powered analysis on any ticker: trendlines, sentiment, impact, and price forecast. Use this first for any stock-specific question."
    ),
    Tool(
        name="retrieve_relevant_context",
        func=retrieve_relevant_context,
        description="Search historical news and past analyses for additional context."
    ),
]


# ==================== Memory & Prompt ====================
memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)

system_prompt = """You are FinForgeAI, an expert financial assistant powered by Grok.
You are knowledgeable, professional, concise, and honest.

Rules:
- When the user asks about any specific stock or ticker, ALWAYS use the full_market_analysis tool first.
- For general market updates, use get_latest_financial_news.
- Use retrieve_relevant_context when more historical background is needed.
- Give clear insights with confidence levels and actionable recommendations."""

prompt = ChatPromptTemplate.from_messages([
    ("system", system_prompt),
    ("placeholder", "{chat_history}"),
    ("human", "{input}"),
    ("placeholder", "{agent_scratchpad}"),
])


# ==================== Agent Setup ====================
agent = create_tool_calling_agent(llm, tools, prompt)

agent_executor = AgentExecutor(
    agent=agent,
    tools=tools,
    memory=memory,
    verbose=True,
    handle_parsing_errors=True
)

logger.success("🤖 FinForgeAI Agent is ready with Grok as core LLM!")