const { GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const { FaissStore } = require("@langchain/community/vectorstores/faiss");
const { ChatPromptTemplate } = require("@langchain/core/prompts");
const { createStuffDocumentsChain } = require("langchain/chains/combine_documents");
const { StringOutputParser } = require("@langchain/core/output_parsers");
const path = require('path');

// --- FIX: Define the index path relative to the project's root directory ---
const INDEX_PATH = path.join(process.cwd(), 'faiss_index');

class AIService {
  constructor() {
    this.llm = new ChatGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY, model: "gemini-1.5-flash-latest", temperature: 0.25 });
    this.embeddings = new GoogleGenerativeAIEmbeddings({ apiKey: process.env.GEMINI_API_KEY });
    this.agents = {};
    this.isInitialized = false;
  }

  async initialize() {
    try {
      console.log("   Initializing agent prompts...");

      this.agents.router = ChatPromptTemplate.fromTemplate(
        `Classify the user's intent as "occams_query" or "conversational". Respond with ONLY one of these two words.\nInput: "{input}"\nClassification:`
      ).pipe(this.llm).pipe(new StringOutputParser());

      this.agents.conversationalChain = ChatPromptTemplate.fromMessages([
          ["system", "You are a friendly, professional AI assistant for Occams Advisory. Respond warmly and briefly to greetings, then guide the user towards the company's services."],
          ["human", "{input}"]
      ]).pipe(this.llm).pipe(new StringOutputParser());

      this.agents.queryRefiner = ChatPromptTemplate.fromTemplate(
        `You are a prompt engineer. Rewrite the user's question into a clear, specific query for a vector database search about a financial advisory firm.\nOriginal question: "{input}"\nRefined query:`
      ).pipe(this.llm).pipe(new StringOutputParser());
      
      this.agents.ragChain = await createStuffDocumentsChain({
          llm: this.llm,
          prompt: ChatPromptTemplate.fromTemplate(
            `You are a senior analyst at Occams Advisory. Provide a comprehensive, well-structured answer to the user's question using ONLY the provided context. Use bullet points for clarity. If the answer is not in the context, state that clearly.\n\nContext:\n{context}\n\nQuestion: {input}\n\nDetailed Answer:`
          )
        });

      this.agents.suggestionGenerator = ChatPromptTemplate.fromTemplate(
        `Based on the provided Q&A, generate three insightful follow-up questions. Return ONLY a valid JSON object with a single key "suggestions" which is an array of three strings.\n\nQ&A Topic:\n{qa_pair}\n\nJSON Output:`
      ).pipe(this.llm).pipe(new StringOutputParser());

      this.isInitialized = true;
      console.log("   ✅ Agent prompts initialized successfully.");
    } catch (error) {
      console.error('❌ CRITICAL FAILURE during agent prompt initialization.');
      throw error;
    }
  }

  async getResponse(message) {
    if (!this.isInitialized) {
      return { answer: "AI agents were not initialized. Please check server logs.", sources: [], suggestions: [] };
    }
    try {
      const route = (await this.agents.router.invoke({ input: message })).trim().toLowerCase();
      console.log(`🤖 Router classified intent as: "${route}"`);

      if (route.includes('conversational')) {
        const answer = await this.agents.conversationalChain.invoke({ input: message });
        const suggestions = ["What are your main services?", "Tell me about your tax credits.", "How do you help startups?"];
        return { answer, sources: [], suggestions };
      }

      if (route.includes('occams_query')) {
        const refinedQuery = await this.agents.queryRefiner.invoke({ input: message });
        console.log(`✨ Prompt Refined to: "${refinedQuery}"`);

        console.log("   Loading knowledge base from disk for this request...");
        const vectorStore = await FaissStore.load(INDEX_PATH, this.embeddings);
        const retriever = vectorStore.asRetriever({ k: 5 });
        const context = await retriever.invoke(refinedQuery);
        console.log(`📚 Retrieved ${context.length} documents for context.`);

        const answer = await this.agents.ragChain.invoke({ input: refinedQuery, context: context });
        console.log(`✍️  Synthesized Answer.`);
        
        let suggestions = [];
        try {
          const qa_pair = `Question: ${refinedQuery}\nAnswer: ${answer}`;
          const suggestionJsonString = await this.agents.suggestionGenerator.invoke({ qa_pair });
          const match = suggestionJsonString.match(/\{.*\}/s);
          if (match) {
            suggestions = JSON.parse(match[0]).suggestions || [];
          }
          console.log(`💡 Generated suggestions:`, suggestions);
        } catch(e) { console.error("Could not generate suggestions.", e); }
        
        return { answer, sources: context.map(doc => doc.metadata), suggestions };
      }
      
      return { answer: "I'm sorry, I couldn't determine the nature of your request. Please ask a specific question about Occams Advisory.", sources: [], suggestions: [] };
    } catch (error) {
      console.error("An error occurred during the getResponse workflow:", error);
      return { answer: "I'm sorry, a critical error occurred. The technical team has been notified.", sources: [], suggestions: [] };
    }
  }
}

module.exports = AIService;