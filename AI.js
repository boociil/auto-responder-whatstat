require('dotenv').config();
const OpenAI = require("openai");
const fs = require('fs');
const pdfParse = require('pdf-parse');
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');
// const { OpenAIEmbeddings } = require('langchain/embeddings/openai');
const {MemoryVectorStore} = require('langchain/vectorstores/memory')
const { OpenAIEmbeddings, ChatOpenAI } = require('@langchain/openai');


const openai = new OpenAI({
  
  baseURL: 'https://openrouter.ai/api/v1',
    // apiKey : "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",
    apiKey : process.env.OPENAI_API_KEY,
});


const prompt = `
keterangan : {
    "Anda" adalah admin BPS Kabupaten Majene yang akan menjawab pertanyaan dari pengguna WhatsApp.
    "Pertanyaan" adalah pesan yang dikirim oleh pengguna WhatsApp.
    "Respon" adalah jawaban yang diberikan oleh Anda sebagai admin BPS Kabupaten Majene.
    Lakukan "Crawling" pada website resmi BPS Kabupaten Majene (https://majenekab.bps.go.id) untuk mendapatkan informasi yang relevan dengan pertanyaan yang diajukan.  
    "Anda" harus memberikan jawaban yang sesuai dengan data dan informasi yang tersedia di website resmi BPS Kabupaten Majene.
},
batasan : {
    "Anda" hanya menjawab pertanyaan yang relevan dengan statistik dan data resmi BPS Kabupaten Majene.
    "Anda" tidak memberikan informasi pribadi atau data yang tidak tersedia.
    "Anda" hanya memberikan informasi dari website resmi BPS Kabupaten Majene (https://majenekab.bps.go.id) atau publikasi resmi BPS Kabupaten Majene.
    "Anda" tidak melakukan pengolahan data sendiri, hanya memberikan informasi dari publikasi resmi BPS Kabupaten Majene.
    "Anda" tidak menjawab pertanyaan yang tidak relevan dengan statistik.
},
format : {
    "Anda" menjawab pertanyaan dengan format yang jelas dan mudah dipahami.
    "Anda" memberikan jawaban yang singkat, padat, dan jelas.
    "Anda" tidak memberikan jawaban yang terlalu panjang atau bertele-tele.
    "Anda" memberikan jawaban dalam bahasa Indonesia yang baik dan benar.
    "Anda" tidak menggunakan bahasa gaul atau bahasa yang tidak baku.
    "Anda" memberikan jawaban yang sesuai dengan konteks pertanyaan.
},
`

const prompt2 = `
    dengan informasi tambahan sumber pencarian google dan web BPS Majene di link (https://majenekab.bps.go.id/), jawablah pesan berikut sebagai admin BPS Kabupaten Majene dengan ramah maksimal 30 kata.
`
const pdfBuffer = fs.readFileSync('./pdf/mda2025.pdf');

async function sendPrompt(reqData, idUser) {
  const pdfData = await pdfParse(pdfBuffer);
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  const splitDocs = await splitter.createDocuments([pdfData.text]);

  console.log(splitDocs);

  const embeddings = new OpenAIEmbeddings({
    baseURL: 'https://openrouter.ai/api/v1',
    // apiKey : "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",
    apiKey : process.env.OPENAI_API_KEY,
  });

  const vectorStore = await MemoryVectorStore.fromDocuments(splitDocs, embeddings);

  const chain = RetrievalQAChain.fromLLM(openai, vectorStore.asRetriever());

  const result = await chain.call({
    query: 'Apa isi utama dari PDF ini?',
  });
  
  // const completion = await openai.chat.completions.create({
  //   messages: [
  //     { role: "system", content: prompt },
  //     { role: "user", content: `${reqData}`}
  //   ],
  //   model: "deepseek/deepseek-chat-v3-0324:free",
  // });

  // // Tambahkan pengecekan dan log
  // if (!completion.choices || !completion.choices[0]) {
  //   console.error('AI API response error:', completion);
  //   throw new Error('AI API response invalid');
  // }

  // console.log(completion.choices[0].message.content);
  // return completion.choices[0].message.content;
  return result.text
}

module.exports = {
  getAIRespond: sendPrompt
};