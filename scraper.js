const { GoogleGenerativeAIEmbeddings } = require("@langchain/google-genai");
const { FaissStore } = require("@langchain/community/vectorstores/faiss");
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const { Document } = require("@langchain/core/documents");
const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const BASE_URL = 'https://www.occamsadvisory.com';
const PAGES_TO_SCRAPE = ['/', '/business-services-growth-incubation', '/tax-credits', '/financial-technology-payment-solutions', '/capital-markets-investment-banking', '/about-us', '/contact-us'];

// --- FIX: Define the index path relative to the project's root directory ---
const INDEX_PATH = path.join(process.cwd(), 'faiss_index');

async function createAndSaveVectorStore() {
  console.log('--- Occams Advisory Knowledge Base Builder ---');
  let browser = null;
  try {
    console.log('🕷️  [1/3] Starting live web scraping...');
    browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    const scrapedDocs = [];

    for (const pagePath of PAGES_TO_SCRAPE) {
      const url = `${BASE_URL}${pagePath}`;
      console.log(`    ➡️  Scraping: ${url}`);
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
      const title = await page.title();
      const content = await page.evaluate(() => {
        const selectors = ['h1', 'h2', 'h3', 'h4', 'p', 'li', '.elementor-heading-title', '.elementor-text-editor'];
        const elements = document.querySelectorAll(selectors.join(', '));
        return Array.from(elements).map(el => el.innerText.trim()).filter(text => text.length > 10);
      });
      scrapedDocs.push(new Document({ pageContent: content.join('\n\n'), metadata: { url, title } }));
    }
    console.log(`    ✅ Scraped ${scrapedDocs.length} pages successfully.`);

    console.log('🧠  [2/3] Processing and vectorizing text...');
    const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1500, chunkOverlap: 200 });
    const splitDocs = await textSplitter.splitDocuments(scrapedDocs);
    const embeddings = new GoogleGenerativeAIEmbeddings({ apiKey: process.env.GEMINI_API_KEY });
    const vectorStore = await FaissStore.fromDocuments(splitDocs, embeddings);
    console.log(`    ✅ Created vector store with ${splitDocs.length} text chunks.`);

    console.log(`💾  [3/3] Saving vector store index to disk...`);
    await fs.rm(INDEX_PATH, { recursive: true, force: true });
    await vectorStore.save(INDEX_PATH);
    console.log(`    ✅ Index saved successfully to: ${INDEX_PATH}`);

    console.log('\n🎉  Knowledge Base created successfully! The chatbot is ready.');
  } catch (error) {
    console.error('\n❌ CRITICAL FAILURE during knowledge base creation:', error);
  } finally {
    if (browser) await browser.close();
  }
}

createAndSaveVectorStore();