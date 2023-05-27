const fs = require("fs");
const { YoutubeTranscript } = require("youtube-transcript");
const { Configuration, OpenAIApi } = require("openai");

const YOUTUBE_URL = "https://www.youtube.com/watch?v=bZQun8Y4L2A";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

function getVideoID(youtubeURL) {
  const regExp =
    /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = youtubeURL.match(regExp);
  return match && match[7].length == 11 ? match[7] : false;
}

async function fetchTranscript(youtubeURL) {
  const rawTranscript = await YoutubeTranscript.fetchTranscript(youtubeURL);
  const transcriptText = rawTranscript.map((snippet) => snippet.text).join(" ");
  //   console.log(transcriptText);
  return transcriptText;
}

// gpt-3.5-turbo has a context window of 4K, which means
// 4000 tokens, 3000 words, 12000 characters
// but we use tiny windows to
async function splitText(text) {
  const chunkSize = 8000;
  const chunks = [];

  for (let i = 0; i < text.length; i += chunkSize) {
    const chunk = text.substr(i, chunkSize);
    chunks.push(chunk);
  }

  return chunks;
}

async function convertToConversation(transcript) {
  const chat = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "user",
        content: transcript,
      },
      {
        role: "system",
        content: `The above is a transcript of a YouTube video. Label the speakers and reformat it as a conversation.`,
      },
    ],
    temperature: 0,
  });

  console.log(
    "Transcript chunk: ",
    transcript.substr(0, 80),
    transcript.length + " chars"
  );

  const tokens = Math.ceil(chat.data.usage.total_tokens / 1000);
  console.log(`Tokens: ${tokens}K`);

  const cost = tokens * 0.002;
  console.log(`Cost: $${cost}`);

  const conversation = chat.data.choices[0].message.content;
  return conversation;
}

async function writeStringToFile(filePath, content) {
  try {
    await fs.promises.writeFile(filePath, content);
    console.log("The file has been saved successfully.");
  } catch (err) {
    console.error("An error occurred while writing to the file:", err);
  }
}

async function run() {
  const transcript = await fetchTranscript(YOUTUBE_URL);
  console.log(
    `Transcript: ${transcript.substr(0, 80)}... (${transcript.length} chars)`
  );

  const chunks = await splitText(transcript);
  console.log(`Chunk count: ${chunks.length}`);

  const conversationChunks = await Promise.all(
    chunks.map((chunk) => convertToConversation(chunk))
  );
  const conversation = conversationChunks.join("\n\n");
  console.log("conversation", conversation);

  const fileName = `yt-${getVideoID(YOUTUBE_URL)}.txt`;
  await writeStringToFile(fileName, conversation);
  console.log(`Conversation saved to ${fileName}`);
}

run();
