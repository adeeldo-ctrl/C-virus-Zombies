const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const root = path.resolve(__dirname, "dist");
const mime = {".html":"text/html",".js":"text/javascript",".css":"text/css"};
const server = http.createServer((req,res) => {
  const pathname = decodeURIComponent(new URL(req.url,"http://localhost").pathname);
  const requested = pathname === "/" ? "/index.html" : pathname;
  const file = path.resolve(root, "." + requested);
  if (!file.startsWith(root + path.sep) && file !== path.join(root,"index.html")) {res.writeHead(403);return res.end("Forbidden");}
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);return res.end("Not found");}res.writeHead(200,{"content-type":mime[path.extname(file)]||"application/octet-stream"});res.end(data);});
});
(async()=>{
  await new Promise(resolve=>server.listen(4173,"127.0.0.1",resolve));
  const browser=await chromium.launch({headless:true,args:["--use-gl=swiftshader","--enable-webgl"]});
  const errors=[];
  const watch=page=>{
    page.on("pageerror",e=>errors.push(e.message));
    page.on("console",m=>{if(m.type()==="error")errors.push(m.text());});
    page.on("requestfailed",r=>errors.push("Request failed: "+r.url()+" "+(r.failure()?.errorText||"")));
    page.on("response",r=>{if(r.status()>=400)errors.push("HTTP "+r.status()+": "+r.url());});
  };
  const waitScene=async page=>{
    await page.waitForTimeout(1200);
    await page.waitForFunction(()=>!!window.__CVIRUS_DEBUG__&&window.__CVIRUS_DEBUG__.scene.isReady(),null,{timeout:12000});
  };
  try {
    const desktop=await browser.newPage({viewport:{width:1280,height:800}});
    watch(desktop);
    await desktop.goto("http://127.0.0.1:4173/",{waitUntil:"domcontentloaded"});
    await waitScene(desktop);
    if(!await desktop.locator("#main-menu").isVisible())throw new Error("Main menu did not appear on first launch.");
    await desktop.locator("#new-game").click();
    await desktop.waitForLoadState("domcontentloaded");
    await waitScene(desktop);
    const initial=await desktop.evaluate(()=>({zombies:window.__CVIRUS_DEBUG__.zombies.length,heroParts:window.__CVIRUS_DEBUG__.heroRig.heroParts.length,interiors:window.__CVIRUS_DEBUG__.interiorRooms.map(r=>r.type),vehicles:window.__CVIRUS_DEBUG__.vehicles.map(v=>v.type)}));
    if(initial.zombies!==5||initial.heroParts<10||initial.interiors.join(",")!=="CLINIC,SHOP,POLICE")throw new Error("Core world initialization failed: "+JSON.stringify(initial));
    for(const required of ["SEDAN","MOTORCYCLE","AUTO RICKSHAW","CHINGCHI","MINI BUS","4K BUS"])if(!initial.vehicles.includes(required))throw new Error("Missing drivable transport: "+required);
    // Exercise the actual touchscreen-style joystick rather than desktop keyboard input.
    const stick=desktop.locator("#stick"),rect=await stick.boundingBox();
    await desktop.mouse.move(rect.x+rect.width/2,rect.y+rect.height/2);
    await desktop.mouse.down();
    await desktop.mouse.move(rect.x+rect.width/2,rect.y+rect.height/2-38,{steps:3});
    await desktop.waitForTimeout(350);
    await desktop.mouse.up();
    const moved=await desktop.evaluate(()=>window.__CVIRUS_DEBUG__.player.position.z);
    if(!(moved<35))throw new Error("Touch joystick did not move the player.");
    // Verify vehicle proximity, enter/exit and mobile-facing prompts.
    await desktop.evaluate(()=>{const d=window.__CVIRUS_DEBUG__;d.player.position.set(d.vehicle.position.x,.95,d.vehicle.position.z+3.2);});
    await desktop.waitForTimeout(100);
    if(!await desktop.locator("#vehicle-prompt").isVisible())throw new Error("Vehicle proximity prompt did not appear.");
    await desktop.locator("#drive").click();
    if(!await desktop.evaluate(()=>window.__CVIRUS_DEBUG__.driving))throw new Error("Vehicle enter interaction failed.");
    await desktop.locator("#drive").click();
    if(await desktop.evaluate(()=>window.__CVIRUS_DEBUG__.driving))throw new Error("Vehicle exit interaction failed.");
    // Verify backpack consumables.
    await desktop.locator("#inventory-button").click();
    await desktop.evaluate(()=>{const d=window.__CVIRUS_DEBUG__;d.state.health=50;d.state.inventory.medicine=1;document.getElementById("health").style.width="50%";document.getElementById("use-medicine").disabled=false;});
    await desktop.locator("#use-medicine").click();
    const medicine=await desktop.evaluate(()=>({health:window.__CVIRUS_DEBUG__.state.health,count:window.__CVIRUS_DEBUG__.state.inventory.medicine}));
    if(medicine.health!==80||medicine.count!==0)throw new Error("Backpack medicine interaction failed.");
    await desktop.locator("#inventory-button").click();
    // Verify persistent safe-house storage transfer.
    await desktop.evaluate(()=>{const d=window.__CVIRUS_DEBUG__;d.player.position.set(d.safehouseCenter.x,.95,d.safehouseCenter.z+1.5);d.state.inventory.water=2;d.state.inventory.parts=1;});
    await desktop.waitForTimeout(100);
    if(!await desktop.locator("#storage-button").isVisible())throw new Error("Safe-house storage action did not appear.");
    await desktop.locator("#storage-button").click();
    if(!await desktop.locator("#storage-panel").isVisible())throw new Error("Safe-house storage panel did not open.");
    await desktop.locator("#store-all").click();
    const stored=await desktop.evaluate(()=>window.__CVIRUS_DEBUG__.state.stash);
    if(stored.water!==2||stored.parts!==1)throw new Error("Safe-house storage did not persist deposited supplies.");
    await desktop.locator("#take-all").click();
    const withdrawn=await desktop.evaluate(()=>({stash:window.__CVIRUS_DEBUG__.state.stash,inventory:window.__CVIRUS_DEBUG__.state.inventory}));
    if(withdrawn.stash.water!==0||withdrawn.inventory.water!==2)throw new Error("Safe-house storage withdrawal failed.");
    await desktop.locator("#close-storage").click();
    // Complete mission one using the real rescue action and supply objective.
    await desktop.evaluate(()=>{const d=window.__CVIRUS_DEBUG__;d.player.position.copyFrom(d.survivorRoot.position);});
    await desktop.waitForTimeout(100);
    if(!await desktop.locator("#rescue").isVisible())throw new Error("Survivor rescue action did not appear.");
    await desktop.locator("#rescue").click();
    if(!await desktop.evaluate(()=>window.__CVIRUS_DEBUG__.state.rescued))throw new Error("Survivor rescue action failed.");
    await desktop.evaluate(()=>{const d=window.__CVIRUS_DEBUG__;d.pickups.forEach(p=>{p.collected=true;p.mesh.setEnabled(false);p.marker.setEnabled(false);});d.state.supplies=4;document.getElementById("supplies").textContent="4";d.player.position.copyFrom(d.safe.position);});
    await desktop.waitForFunction(()=>window.__CVIRUS_DEBUG__.state.safe,{timeout:5000});
    if(!(await desktop.locator("#message").innerText()).includes("safe zone reached"))throw new Error("Mission one extraction did not complete.");
    await desktop.locator("#retry-button").click();
    if(await desktop.evaluate(()=>window.__CVIRUS_DEBUG__.state.missionIndex)!==2)throw new Error("Next story mission did not unlock.");
    // Complete the emergency radio mission using its contextual ACTIVATE action.
    for(let i=0;i<3;i++){
      await desktop.evaluate(index=>{const d=window.__CVIRUS_DEBUG__;d.player.position.copyFrom(d.relayStations[index].root.position);},i);
      await desktop.waitForTimeout(100);
      if(!await desktop.locator("#rescue").isVisible())throw new Error("Radio relay interaction did not appear for station "+i);
      await desktop.locator("#rescue").click();
    }
    await desktop.evaluate(()=>{const d=window.__CVIRUS_DEBUG__;d.player.position.copyFrom(d.safe.position);});
    await desktop.waitForFunction(()=>window.__CVIRUS_DEBUG__.state.safe,{timeout:5000});
    if(!(await desktop.locator("#end-title").innerText()).includes("CAMPAIGN COMPLETE"))throw new Error("Second mission campaign completion screen missing.");
    if(errors.length)throw new Error("Desktop browser errors: "+errors.join(" | "));
    // Fresh mobile launch: verify actual Android-style touch joystick, camera drag and jump.
    const mobile=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
    watch(mobile);
    await mobile.goto("http://127.0.0.1:4173/",{waitUntil:"domcontentloaded"});
    await waitScene(mobile);
    await mobile.locator("#new-game").click();
    await mobile.waitForLoadState("domcontentloaded");
    await waitScene(mobile);
    const touch=await mobile.context().newCDPSession(mobile);
    const beforeTouch=await mobile.evaluate(()=>window.__CVIRUS_DEBUG__.player.position.z);
    await touch.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[{x:76,y:768,id:1}]});
    await touch.send("Input.dispatchTouchEvent",{type:"touchMove",touchPoints:[{x:76,y:728,id:1}]});
    await mobile.waitForTimeout(450);
    await touch.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]});
    const afterTouch=await mobile.evaluate(()=>window.__CVIRUS_DEBUG__.player.position.z);
    if(!(afterTouch<beforeTouch))throw new Error("Android touch joystick did not move the player.");
    const yawBefore=await mobile.evaluate(()=>window.__CVIRUS_DEBUG__.state.yaw);
    await touch.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[{x:330,y:500,id:2}]});
    await touch.send("Input.dispatchTouchEvent",{type:"touchMove",touchPoints:[{x:350,y:500,id:2}]});
    await touch.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]});
    const yawAfter=await mobile.evaluate(()=>window.__CVIRUS_DEBUG__.state.yaw);
    if(yawAfter===yawBefore)throw new Error("Android right-side camera drag did not respond.");
    const jumpStart=await mobile.evaluate(()=>window.__CVIRUS_DEBUG__.player.position.y);
    await mobile.locator("#jump").evaluate(el=>el.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true,pointerId:7,pointerType:"touch"})));
    await mobile.waitForTimeout(180);
    const jumpPeak=await mobile.evaluate(()=>window.__CVIRUS_DEBUG__.player.position.y);
    if(!(jumpPeak>jumpStart+.3))throw new Error("Android jump touch action failed.");
    if(!await mobile.locator("#stamina").count())throw new Error("Mobile stamina HUD missing.");
    if(errors.length)throw new Error("Browser errors: "+errors.join(" | "));
    console.log("PASS: title/new game, Android-style movement, six-vehicle fleet, enter/exit, backpack, safe-house storage, survivor rescue, two-mission progression, Android joystick/camera/jump and no browser errors.");
  } finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exit(1);});
