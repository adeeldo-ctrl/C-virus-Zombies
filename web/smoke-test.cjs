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
    const started=await desktop.evaluate(()=>({paused:window.__CVIRUS_DEBUG__.state.paused,menuHidden:document.getElementById("main-menu").hidden}));
    if(started.paused||!started.menuHidden)throw new Error("New Game did not enter active gameplay.");
    // Verify vehicle proximity, enter/exit and mobile-facing prompts.
    await desktop.evaluate(()=>{
      const d=window.__CVIRUS_DEBUG__;
      // Stand beside the sedan, outside its collision box but inside DRIVE range.
      d.state.paused=false;
      d.player.position.set(d.vehicle.position.x+2.3,.95,d.vehicle.position.z);
      d.scene.render();
    });
    const vehiclePromptState=await desktop.evaluate(()=>({hidden:document.getElementById("vehicle-prompt").hidden,paused:window.__CVIRUS_DEBUG__.state.paused,distance:window.__CVIRUS_DEBUG__.nearestVehicle.distance,player:[window.__CVIRUS_DEBUG__.player.position.x,window.__CVIRUS_DEBUG__.player.position.z]}));
    if(vehiclePromptState.hidden||vehiclePromptState.distance>4.8)throw new Error("Vehicle proximity prompt failed: "+JSON.stringify(vehiclePromptState));
    const vehicleRange=await desktop.evaluate(()=>window.__CVIRUS_DEBUG__.nearestVehicle.distance);
    if(vehicleRange>4.8)throw new Error("Vehicle proximity prompt appeared outside interaction range: "+vehicleRange);
    await desktop.locator("#drive").click();
    if(!await desktop.evaluate(()=>window.__CVIRUS_DEBUG__.driving))throw new Error("Vehicle enter interaction failed.");
    await desktop.locator("#drive").click();
    if(await desktop.evaluate(()=>window.__CVIRUS_DEBUG__.driving))throw new Error("Vehicle exit interaction failed.");
    // Vehicle service bay: refuel is free, repairs consume one spare part.
    await desktop.evaluate(()=>{const d=window.__CVIRUS_DEBUG__;d.vehicles[0].root.position.set(d.serviceCenter.x,.425,d.serviceCenter.z);d.player.position.set(d.serviceCenter.x+2.3,.95,d.serviceCenter.z);d.vehicles[0].fuel=12;d.vehicles[0].condition=42;d.state.inventory.parts=1;d.scene.render();});
    await desktop.waitForFunction(()=>!document.getElementById("service-button").hidden,null,{timeout:5000});
    await desktop.locator("#service-button").click();
    await desktop.locator("#refuel-vehicle").click();
    await desktop.locator("#repair-vehicle").click();
    const serviced=await desktop.evaluate(()=>({fuel:window.__CVIRUS_DEBUG__.vehicles[0].fuel,condition:window.__CVIRUS_DEBUG__.vehicles[0].condition,parts:window.__CVIRUS_DEBUG__.state.inventory.parts}));
    if(serviced.fuel!==100||serviced.condition!==100||serviced.parts!==0)throw new Error("Vehicle refuel/repair service failed.");
    await desktop.locator("#close-service").click();
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
    const escortStarted=await desktop.evaluate(()=>({rescued:window.__CVIRUS_DEBUG__.state.rescued,visible:window.__CVIRUS_DEBUG__.survivorRoot.isEnabled()}));
    if(!escortStarted.rescued||!escortStarted.visible)throw new Error("Rescued shopkeeper did not remain in the world for escort.");
    await desktop.evaluate(()=>{const d=window.__CVIRUS_DEBUG__;d.pickups.forEach(p=>{p.collected=true;p.mesh.setEnabled(false);p.marker.setEnabled(false);});d.state.supplies=4;document.getElementById("supplies").textContent="4";d.survivorRoot.position.copyFrom(d.safe.position);d.player.position.copyFrom(d.safe.position);});
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
    const jumpBox=await mobile.locator("#jump").boundingBox();
    await touch.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[{x:jumpBox.x+jumpBox.width/2,y:jumpBox.y+jumpBox.height/2,id:3}]});
    await touch.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]});
    await mobile.waitForTimeout(180);
    const jumpPeak=await mobile.evaluate(()=>window.__CVIRUS_DEBUG__.player.position.y);
    if(!(jumpPeak>jumpStart+.3))throw new Error("Android jump touch action failed.");
    if(!await mobile.locator("#stamina").count())throw new Error("Mobile stamina HUD missing.");
    if(errors.length)throw new Error("Browser errors: "+errors.join(" | "));
    console.log("PASS: title/new game, Android-style movement, six-vehicle fleet, enter/exit, backpack, safe-house storage, survivor rescue, two-mission progression, Android joystick/camera/jump and no browser errors.");
  } finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exit(1);});
