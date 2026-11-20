const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const root = path.resolve(__dirname);
const mime = {".html":"text/html",".js":"text/javascript",".css":"text/css"};
const server = http.createServer((req,res) => {
  const pathname = decodeURIComponent(new URL(req.url,"http://localhost").pathname);
  const file = path.resolve(root, "." + pathname);
  if (!file.startsWith(root + path.sep) && file !== path.join(root,"index.html")) {res.writeHead(403);return res.end("Forbidden");}
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);return res.end("Not found");}res.writeHead(200,{"content-type":mime[path.extname(file)]||"application/octet-stream"});res.end(data);});
});
(async()=>{
  await new Promise(resolve=>server.listen(4173,"127.0.0.1",resolve));
  const browser=await chromium.launch({headless:true,args:["--use-gl=swiftshader","--enable-webgl"]});
  const page=await browser.newPage({viewport:{width:1280,height:800}});
  const errors=[];
  page.on("pageerror",e=>errors.push(e.message));
  page.on("console",m=>{if(m.type()==="error")errors.push(m.text());});
  try {
    await page.goto("http://127.0.0.1:4173/index.html",{waitUntil:"domcontentloaded"});
    await page.waitForFunction(()=>window.__CVIRUS_DEBUG__ && window.__CVIRUS_DEBUG__.scene.isReady(),null,{timeout:30000});
    const initial=await page.evaluate(()=>({canvas:!!document.querySelector("#game"),zombies:window.__CVIRUS_DEBUG__.zombies.length,playerZ:window.__CVIRUS_DEBUG__.player.position.z}));
    if(!initial.canvas||initial.zombies!==5)throw new Error("Initial scene assertions failed: "+JSON.stringify(initial));
    await page.keyboard.down("w");await page.waitForTimeout(500);await page.keyboard.up("w");
    const moved=await page.evaluate(()=>window.__CVIRUS_DEBUG__.player.position.z);
    if(!(moved<initial.playerZ))throw new Error("Forward input did not move player toward objective.");
    await page.evaluate(()=>{const d=window.__CVIRUS_DEBUG__;d.player.position.copyFrom(d.safe.position);});
    await page.waitForFunction(()=>window.__CVIRUS_DEBUG__.state.safe,{timeout:5000});
    const message=await page.locator("#message").innerText();
    if(!message.includes("Safe zone reached"))throw new Error("Safe-zone completion message missing.");
    if(errors.length)throw new Error("Browser errors: "+errors.join(" | "));
    console.log("PASS: scene loaded, five pursuers spawned, keyboard movement works, safe-zone objective completes, no browser errors.");
  } finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exit(1);});
