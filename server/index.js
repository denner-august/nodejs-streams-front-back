import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { Readable, Transform } from "node:stream";
import { WritableStream, TransformStream } from "node:stream/web";
import { setTimeout } from "node:timers/promises";
import csvtojson from "csvtojson";

const port = 3000;

createServer(async (req, res) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "*",
  };

  if (req.method === "OPTIONS") {
    res.writeHead(204, headers);
    res.end();
    return;
  }
  req.once("close", () => console.log(`closed`, items));
  let items = 0;
  Readable.toWeb(createReadStream("./animeflv.csv"))
    //passo a passo
    .pipeThrough(Transform.toWeb(csvtojson()))
    .pipeThrough(
      new TransformStream({
        transform(chuck, controller) {
          const data = JSON.parse(Buffer.from(chuck));
          const mappeData = {
            title: data.title,
            description: data.description,
            url_anime: data.url_anime,
          };
          controller.enqueue(JSON.stringify(mappeData).concat("\n"));
        },
      })
    )
    .pipeTo(
      //pipeto ultima etapa
      new WritableStream({
        async write(chuck) {
          await setTimeout(100);
          items++;

          res.write(chuck);
        },
        close() {
          res.end();
        },
      })
    );
  res.writeHead(200, headers);
})
  .listen(port)
  .on("listening", () => console.log("running 3000"));
