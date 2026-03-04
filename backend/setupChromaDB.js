require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { ChromaClient } = require('chromadb');
const { getEmbedding } = require('./utils/embeddings');
const medicalKnowledge = require('./knowledge/medicalKnowledge');

async function setupChromaDB() {
  console.log('[ChromaDB] Starting knowledge base setup...');
  console.log('[ChromaDB] Connecting to', process.env.CHROMA_URL || 'http://localhost:8000');
  
  const client = new ChromaClient({ path: process.env.CHROMA_URL || 'http://localhost:8000' });

  try {
    await client.deleteCollection({ name: 'parahelper_knowledge' });
    console.log('[ChromaDB] Cleared existing collection');
  } catch (e) {
    // Collection doesn't exist yet
  }

  const collection = await client.createCollection({
    name: 'parahelper_knowledge',
    metadata: { description: 'ParaHelper medical knowledge base for paramedics' }
  });

  console.log(`[ChromaDB] Embedding ${medicalKnowledge.length} knowledge items...`);

  const batchSize = 5;
  for (let i = 0; i < medicalKnowledge.length; i += batchSize) {
    const batch = medicalKnowledge.slice(i, i + batchSize);
    const embeddings = [];
    
    for (const item of batch) {
      try {
        const embedding = await getEmbedding(item.content);
        embeddings.push(embedding);
      } catch (err) {
        console.error(`[ChromaDB] Failed to embed ${item.id}:`, err.message);
        embeddings.push(new Array(768).fill(0)); // text-embedding-004 uses 768 dims
      }
    }

    await collection.add({
      ids: batch.map(item => item.id),
      documents: batch.map(item => item.content),
      metadatas: batch.map(item => item.metadata),
      embeddings: embeddings
    });

    console.log(`[ChromaDB] Added batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(medicalKnowledge.length / batchSize)}`);
  }

  console.log('[ChromaDB] Knowledge base setup complete!');
  const count = await collection.count();
  console.log(`[ChromaDB] Total items in collection: ${count}`);
}

setupChromaDB().catch((err) => {
  console.error('[ChromaDB] Setup failed:', err.message);
  console.error('');
  console.error('Make sure ChromaDB server is running first:');
  console.error('  Docker: docker run -d --rm -p 8000:8000 chromadb/chroma');
  console.error('  Python: chroma run --path ./chroma_data  (requires Python 3.11 or 3.12)');
  console.error('');
  console.error('The app works without ChromaDB - medical queries will use AI training only.');
  process.exit(1);
});
