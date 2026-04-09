from .vector_store import FinancialRAG
from langchain.chains import RetrievalQA
from langchain_openai import ChatOpenAI

rag = FinancialRAG()

def get_rag_chain():
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.3)
    return RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=rag.as_retriever(),
        return_source_documents=True
    )