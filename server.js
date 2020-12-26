const deepai = require("deepai");
const OAuth = require("oauth-1.0a");
const crypto = require("crypto");
const request = require("request");
const needle = require("needle");
const fs = require("fs");
const cheerio = require("cheerio");
const { htmlToText } = require("html-to-text");
require("dotenv").config();

const deep_key = process.env.deep_key
// deepai.setApiKey("4fe904a0-f080-4745-814f-5874275dc1d6");
deepai.setApiKey(deep_key);
const the_key = process.env.key
const the_secret = process.env.secret
const token_key = process.env.token_key
const token_secret = process.env.token_secret


const oauth = OAuth({
  consumer: {
    // key: "t4nnjhdmKQurwBjIjq2WeIysc",
    // secret: "on5JThVo8U45UUZGDvaNuWxJnZomDLT4qTJ9P7vxdFqdViD6ic",
    key: the_key,
    secret: the_secret
  },
  signature_method: "HMAC-SHA1",
  hash_function(base_string, key) {
    return crypto.createHmac("sha1", key).update(base_string).digest("base64");
  },
});

const token = {
  // key: "1341698998294503430-sGPnwIk97kCqZYbWftMKWDuNbtM3Dv",
  // secret: "3fvLKVWOwKqS72DOs1rauTlvgNt5IfdTCGUNE56MSJ6Xy",
  key: token_key,
  secret: token_secret
};

const request_data = {
  url: "https://api.twitter.com/1.1/statuses/update.json",
  method: "POST",
  data: { status: "this is th best test tweet i've ever written" },
};


const randomSeed = async () => {
  const resp = await needle(
    "get",
    `https://en.wikipedia.org/wiki/Special:Random`,
    {
      follow_max: 4,
    }
  );

  console.log(`got code ${resp.statusCode} from wikipedia`);
  const $ = cheerio.load(resp.body);
  let paragraphsArray = [];
  let sentencesArray = [];
  $("p", ".mw-parser-output")
    .toArray()
    .forEach((item) => {
      let cleanText = htmlToText(cheerio.html(item));
      cleanText = cleanText.replace(/\[.+\]/g, " ");
      cleanText = cleanText.replace("  ", "");
      cleanText = cleanText.replace("\n", " ");
      sentencesArray = cleanText.split(".");
      // sentencesArray.forEach((sentence)=>{
      //     sentence.replace('\n', ' ')
      // })
      paragraphsArray.push(sentencesArray);
    //   console.log(cleanText);
    //   console.log(sentencesArray);
    });
  // console.log(paragraphsArray);
  let randomSeed;
  const getRandomSeed = () => {
    let randomParagraphIndex = Math.floor(
      Math.random() * paragraphsArray.length
    );
    let randomSentenceIndex = Math.floor(Math.random() * sentencesArray.length);
    console.log(`${randomParagraphIndex} <= ${paragraphsArray.length}, ${randomSentenceIndex} <= ${sentencesArray.length}`)
    let rndmSeed = paragraphsArray[randomParagraphIndex][randomSentenceIndex];
    if (rndmSeed == "" || rndmSeed == " ") {
      getRandomSeed();
    } else {
      randomSeed = rndmSeed;
    }
  };
  getRandomSeed()
  randomSeed = randomSeed.replace('\n', ' ')
  randomSeed = randomSeed.replace('  ', ' ')
  randomSeed = randomSeed.replace('   ', ' ')
  console.log("got a random seed phrase:");
  console.log(randomSeed);
  return randomSeed;
};

const generateText = async () => {
  const randomText = await randomSeed();
  try {
    let output = await deepai.callStandardApi("text-generator", {
      text: randomText,
    });

    return output;
  } catch (err) {
    console.log("error from generateText()");
    console.log(err.response.status);
    console.log(err.response.statusText);
  }
};

const postTweet = async () => {
  needle(request_data.method, request_data.url, request_data.data, {
    headers: oauth.toHeader(oauth.authorize(request_data, token)),
  })
    .then((resp) => {
      if (resp.statusCode == 200) {
        // console.log(Object.keys(resp));
        // console.log(resp.body)
        console.log(`Tweet posted at ${resp.body.created_at}`);
      } else {
        console.log(resp.body)
        console.log(`Got code ${resp.statusCode}, ${resp.statusMessage}`);
        
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

const main = async () => {
  try {
    let aiOutput = await generateText();
    let paragraphArray = aiOutput.output
      .split("\n")
      .filter((paragraph) => paragraph != "");
    let randomIndex = () => Math.floor(Math.random() * paragraphArray.length);
    let randomParagraph = paragraphArray[randomIndex()];
    console.log(randomParagraph);
    request_data.data.status = randomParagraph;
    console.log(`There are ${randomParagraph.length} chars in the paragraph`);
    postTweet();
  } catch (err) {
    console.log("error from main()");
    console.log(err);
  }
    setTimeout(main, Math.random() * 28800000);
};

main();


const main3 = () => {
  const html = fs.readFileSync("./test.html");
  // const $ = cheerio.load(html)
  const $ = cheerio.load(html);
  const tocItems = $("p", ".mw-parser-output").toArray();
  const patt = /\[\w*\]/g;

  tocItems.forEach((item) => {
    let cleanText = htmlToText(cheerio.html(item));
    cleanText = cleanText.replace(/\[.+\]/g, " ");
    cleanText = cleanText.replace("  ", "");
    //   cleanText = cleanText.replace(/a/g, '')
    console.log(cleanText);
    console.log("\r\n");
    item.children.forEach((child) => {
      //   console.log(cheerio.html(child))
    });
  });
  //   console.log(tocItems);
};

// main3();
