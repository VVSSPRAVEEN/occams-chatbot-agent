# Occams Advisory - Intelligent AI Assistant

This repository contains the source code for an advanced, intelligent chatbot designed to answer user queries about Occams Advisory. The agent is built using Node.js and the LangChain framework, leveraging Google's Gemini LLM for its reasoning capabilities.

The chatbot uses a multi-agent, Retrieval Augmented Generation (RAG) architecture. It first classifies user intent, refines user prompts for clarity, retrieves relevant information from a vectorized knowledge base of the company website, and synthesizes comprehensive answers.

## Key Features

- **Intelligent Agent Architecture:** The bot uses a multi-step process to classify, validate, refine, retrieve, and synthesize information, leading to more accurate and relevant responses.
- **Retrieval Augmented Generation (RAG):** Answers are strictly grounded in the content of the `occamsadvisory.com` website, preventing hallucinations.
- **Dynamic Suggestions:** After providing an answer, the bot generates relevant follow-up questions to guide the conversation.
- **Conversational Handling:** Gracefully handles greetings and off-topic small talk, steering users back to relevant topics.
- **User-Friendly Interface:** A clean, simple chat interface with a "thinking..." indicator and timer for a better user experience.
- **Durable Knowledge Base:** Uses a FAISS vector store saved to disk, ensuring stability and resilience.

## Tech Stack

- **Backend:** Node.js, Express.js
- **AI/LLM:** LangChain.js, Google Gemini
- **Database:** MongoDB (for conversation logging)
- **Vector Store:** FAISS (for RAG)
- **Web Scraping:** Puppeteer
- **Frontend:** HTML, CSS, Vanilla JavaScript

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/en) (v18 or later recommended)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)
- [Git](https://git-scm.com/)
- A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account (a free tier is sufficient)

## Getting Started

Follow these steps to set up and run the project locally.

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd occams-advanced-chatbot
```

### 2. Install Dependencies

This project has known peer dependency conflicts within the LangChain ecosystem. Use the `--legacy-peer-deps` flag for a successful installation.

```bash
npm install --legacy-peer-deps
```

### 3. Set Up Environment Variables

Create a file named `.env` in the root of the project directory. Copy the contents of `.env.example` into it and fill in your secret keys.

#### `.env.example`
```
# Get your key from Google AI Studio: https://aistudio.google.com/app/apikey
GEMINI_API_KEY="YOUR_GEMINI_API_KEY_HERE"

# Get your connection string from MongoDB Atlas
MONGODB_URI="YOUR_MONGODB_CONNECTION_STRING_HERE"
```

### 4. Build the Knowledge Base

This is a mandatory one-time step. This command runs the web scraper, processes the website content, and creates the `faiss_index` folder which the AI uses as its memory.

```bash
node scraper.js
```
Wait for the script to finish. You should see a success message and a new `faiss_index` directory in your project.

### 5. Run the Server

Once the knowledge base is built, you can start the application server.

```bash
npm start
```
The server will be running at `http://localhost:3000`.

## Project Structure

```
occams-advanced-chatbot/
├── data/              # (legacy) Can be deleted
├── faiss_index/       # The vectorized knowledge base created by the scraper
├── models/
│   ├── Conversation.js  # Mongoose schema for storing chat history
│   └── Feedback.js      # Mongoose schema for user feedback
├── public/            # Frontend files (HTML, CSS, JS)
├── services/
│   └── aiService.js     # The core intelligent agent logic
├── .env               # Secret keys (API keys, database URI)
├── .gitignore         # Specifies files for Git to ignore
├── package.json       # Project dependencies and scripts
├── README.md          # This file
├── scraper.js         # Scrapes the website and builds the FAISS index
└── server.js          # The Express.js server and API endpoints
```