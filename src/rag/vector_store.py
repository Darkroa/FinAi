from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain.schema import Document
from loguru import logger
import os
from pathlib import Path

PERSIST_DIR = "data/chroma_db"

class FinancialRAG:
    def __init__(self):
        self.embeddings = OpenAIEmbeddings(
            model="text-embedding-3-small",
            api_key=os.getenv("OPENAI_API_KEY") or os.getenv("GROK_API_KEY")
        )
        self.vectorstore = Chroma(
            collection_name="financial_news",
            embedding_function=self.embeddings,
            persist_directory=PERSIST_DIR
        )
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200
        )

    def add_articles(self, articles: list):
        """Add raw news articles to vector store"""
        docs = []
        for article in articles:
            text = f"Title: {article.get('title')}\nSource: {article.get('source','')}\nPublished: {article.get('published','')}\n\n{article.get('full_text') or article.get('summary','')}"
            splits = self.text_splitter.split_text(text)
            for i, chunk in enumerate(splits):
                doc = Document(
                    page_content=chunk,
                    metadata={
                        "title": article.get("title"),
                        "source": article.get("source"),
                        "link": article.get("link"),
                        "published": article.get("published"),
                        "chunk_id": i
                    }
                )
                docs.append(doc)
        
        if docs:
            self.vectorstore.add_documents(docs)
            logger.success(f"✅ Added {len(docs)} chunks to ChromaDB")
        return len(docs)

    def similarity_search(self, query: str, k: int = 6):
        results = self.vectorstore.similarity_search(query, k=k)
        return [ {
            "content": doc.page_content,
            "metadata": doc.metadata
        } for doc in results ]

    def as_retriever(self):
        return self.vectorstore.as_retriever(search_kwargs={"k": 6})