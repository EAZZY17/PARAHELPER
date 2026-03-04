const { MongoClient } = require('mongodb');

let client = null;
let usersDb, conversationsDb, operationsDb;

async function connect() {
  if (client) return client;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is required');
  client = new MongoClient(uri);
  await client.connect();
  usersDb = client.db('parahelper_users');
  conversationsDb = client.db('parahelper_conversations');
  operationsDb = client.db('parahelper_operations');
  console.log('[MongoDB] Connected to cluster (parahelper_users, parahelper_conversations, parahelper_operations)');
  return client;
}

async function connectUsersDB() {
  if (!usersDb) await connect();
  return usersDb;
}

async function connectConversationsDB() {
  if (!conversationsDb) await connect();
  return conversationsDb;
}

async function connectOperationsDB() {
  if (!operationsDb) await connect();
  return operationsDb;
}

async function getParamedic(badgeNumber) {
  const db = await connectUsersDB();
  return db.collection('paramedics').findOne({ badge_number: badgeNumber });
}

async function getParamedicById(paramedicId) {
  const db = await connectUsersDB();
  return db.collection('paramedics').findOne({ paramedic_id: paramedicId });
}

async function getAllParamedics() {
  const db = await connectUsersDB();
  return db.collection('paramedics').find({}).toArray();
}

async function getStatusReport(paramedicId) {
  const db = await connectOperationsDB();
  return db.collection('status_reports').findOne(
    { paramedic_id: paramedicId },
    { sort: { report_month: -1 } }
  );
}

async function getShifts(paramedicId) {
  const db = await connectOperationsDB();
  return db.collection('shifts').find({ paramedic_id: paramedicId }).sort({ shift_date: -1 }).toArray();
}

async function saveConversation(conversation) {
  const db = await connectConversationsDB();
  return db.collection('conversations').insertOne(conversation);
}

async function updateConversation(sessionId, update) {
  const db = await connectConversationsDB();
  return db.collection('conversations').updateOne({ session_id: sessionId }, { $set: update });
}

async function getConversation(sessionId) {
  const db = await connectConversationsDB();
  return db.collection('conversations').findOne({ session_id: sessionId });
}

async function getLatestConversation(paramedicId) {
  const db = await connectConversationsDB();
  return db.collection('conversations').findOne(
    { paramedic_id: paramedicId },
    { sort: { started_at: -1 } }
  );
}

async function saveMessage(message) {
  const db = await connectConversationsDB();
  return db.collection('messages').insertOne(message);
}

async function getMessages(sessionId) {
  const db = await connectConversationsDB();
  return db.collection('messages').find({ session_id: sessionId }).sort({ timestamp: 1 }).toArray();
}

async function saveOccurrenceReport(report) {
  const db = await connectOperationsDB();
  return db.collection('occurrence_reports').insertOne(report);
}

async function saveTeddyBearTracking(tracking) {
  const db = await connectOperationsDB();
  return db.collection('teddy_bear_tracking').insertOne(tracking);
}

async function saveShift(shift) {
  const db = await connectOperationsDB();
  return db.collection('shifts').insertOne(shift);
}

async function saveExport(exportRecord) {
  const db = await connectOperationsDB();
  return db.collection('exports').insertOne(exportRecord);
}

async function getOccurrenceReports(paramedicId) {
  const db = await connectOperationsDB();
  return db.collection('occurrence_reports').find({ paramedic_id: paramedicId }).sort({ created_at: -1 }).toArray();
}

async function getTeddyBearRecords(paramedicId) {
  const db = await connectOperationsDB();
  return db.collection('teddy_bear_tracking').find({ paramedic_id: paramedicId }).sort({ event_datetime: -1 }).toArray();
}

async function saveStatusReport(report) {
  const db = await connectOperationsDB();
  return db.collection('status_reports').updateOne(
    { paramedic_id: report.paramedic_id, report_month: report.report_month },
    { $set: report },
    { upsert: true }
  );
}

module.exports = {
  connectUsersDB, connectConversationsDB, connectOperationsDB,
  getParamedic, getParamedicById, getAllParamedics,
  getStatusReport, getShifts,
  saveConversation, updateConversation, getConversation, getLatestConversation,
  saveMessage, getMessages,
  saveOccurrenceReport, saveTeddyBearTracking, saveShift, saveExport,
  getOccurrenceReports, getTeddyBearRecords, saveStatusReport
};
