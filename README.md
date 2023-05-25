# youtube-learner
Extracts insights from YouTube transcripts, goes beyond summaries.

I've written an [article about this on Medium](https://medium.com/@paramaggarwal/beyond-summaries-how-to-use-gpt-to-learn-from-long-youtube-interviews-bba3a5d6aba8). I want to take my learnings and make a Chrome extension of this script that can place these insights beside the YouTube videos itself.

## Run

1. Clone the code and run `yarn install`
2. Set the API key from OpenAI in env: `export OPENAI_API_KEY=abcd`
3. Modify the Youtube video link `YOUTUBE_URL` in the script
4. Run `node index.js` and once complete, open `conversation.txt`

## Explanation

This is the primary code flow of the script:

```
// uses youtube-transcript npm module
const transcript = await fetchTranscript(YOUTUBE_URL);

// because of limited context window of GPT,
// split the text into chunks
const chunks = await splitText(transcript);

// run GPT on each chunk
const conversationChunks = await Promise.all(
  chunks.map((chunk) => convertToConversation(chunk))
);
const conversation = conversationChunks.join("\n\n");

// write the stitched chunks back to a file
await writeStringToFile("conversation.txt", conversation);
```

And then how to prompt the GPT-3 API:

```
const chat = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "user",
        content: transcript,
      },
      {
        role: "system",
        content: `The above is a transcript of a YouTube video.
        Label the statements and reformat it as a conversation.`,
      },
    ],
    temperature: 0,
  });

const conversation = chat.data.choices[0].message.content;
```

## Contact

Follow me on Twitter for updates: [@paramaggarwal](https://twitter.com/paramaggarwal)
