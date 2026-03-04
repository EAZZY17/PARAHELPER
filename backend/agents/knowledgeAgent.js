const { ChromaClient } = require('chromadb');
const { getEmbedding, chatCompletion } = require('../utils/embeddings');
const { getStatusReport, getShifts } = require('../utils/mongodb');

let chromaCollection = null;

async function getChromaCollection() {
  if (chromaCollection) return chromaCollection;
  try {
    const client = new ChromaClient({ path: process.env.CHROMA_URL || 'http://localhost:8000' });
    chromaCollection = await client.getCollection({ name: 'parahelper_knowledge' });
    console.log('[KnowledgeAgent] Connected to ChromaDB collection');
    return chromaCollection;
  } catch (error) {
    console.error('[KnowledgeAgent] ChromaDB connection failed:', error.message);
    return null;
  }
}

async function queryKnowledge(query, role = 'all', nResults = 5) {
  console.log(`[KnowledgeAgent] Querying knowledge base: "${query.substring(0, 50)}..."`);

  try {
    const collection = await getChromaCollection();
    if (!collection) {
      return { results: [], source: 'none' };
    }

    const embedding = await getEmbedding(query);
    
    const results = await collection.query({
      queryEmbeddings: [embedding],
      nResults: nResults,
      where: {
        '$or': [
          { role: role },
          { role: 'all' }
        ]
      }
    });

    return {
      results: results.documents[0] || [],
      metadatas: results.metadatas[0] || [],
      source: 'chromadb'
    };
  } catch (error) {
    console.error('[KnowledgeAgent] Query failed:', error.message);
    return { results: [], source: 'error' };
  }
}

async function getParamedicStatus(paramedicId) {
  console.log(`[KnowledgeAgent] Fetching status for ${paramedicId}`);
  try {
    const status = await getStatusReport(paramedicId);
    return status;
  } catch (error) {
    console.error('[KnowledgeAgent] Status fetch failed:', error.message);
    return null;
  }
}

async function getParamedicShifts(paramedicId) {
  console.log(`[KnowledgeAgent] Fetching shifts for ${paramedicId}`);
  try {
    const shifts = await getShifts(paramedicId);
    return shifts;
  } catch (error) {
    console.error('[KnowledgeAgent] Shifts fetch failed:', error.message);
    return null;
  }
}

async function answerQuestion(question, paramedicProfile, conversationContext = '') {
  console.log('[KnowledgeAgent] Answering question...');

  const knowledge = await queryKnowledge(question, paramedicProfile.role);
  const status = await getParamedicStatus(paramedicProfile.paramedic_id);
  const shifts = await getParamedicShifts(paramedicProfile.paramedic_id);

  const knowledgeContext = knowledge.results.length > 0
    ? `Relevant medical knowledge:\n${knowledge.results.join('\n\n')}`
    : '';

  const statusContext = status
    ? `Paramedic status: ACR completion: ${status.acr_completion} (${status.acr_unfinished} unfinished), Vaccination: ${status.vaccination}, Driver License: ${status.driver_license}, Education: ${status.education}, Uniform credits: ${status.uniform_credits}, Overtime: ${status.overtime} (${status.overtime_count} pending)`
    : '';

  const shiftContext = shifts && shifts.length > 0
    ? `Recent shifts: ${shifts.slice(0, 3).map(s => `${s.shift_date} at ${s.station} (${s.calls_handled} calls)`).join(', ')}`
    : '';

  const answer = await chatCompletion([
    {
      role: 'system',
      content: `You are the Knowledge Agent for ParaHelper. Answer the paramedic's question using provided context.
Paramedic: ${paramedicProfile.first_name} ${paramedicProfile.last_name} (${paramedicProfile.role})
Station: ${paramedicProfile.station}, Unit: ${paramedicProfile.unit}

${knowledgeContext}
${statusContext}
${shiftContext}

Rules:
- Filter medical advice by role: ${paramedicProfile.role}
- If ACP-only content and paramedic is PCP, note the scope limitation
- Always add "confirm against your protocols" for medical dosages
- Be concise and practical
- Return ONLY the answer text, no formatting markers`
    },
    { role: 'user', content: question }
  ], 'gemini-2.5-flash', { max_tokens: 256 });

  return { answer, knowledgeUsed: knowledge.results.length > 0, source: knowledge.source };
}

module.exports = { queryKnowledge, getParamedicStatus, getParamedicShifts, answerQuestion };
