(() => {
  const canvas = document.getElementById("game");
  const engine = new BABYLON.Engine(canvas, true, {preserveDrawingBuffer:false, stencil:true, antialias:true});
  const state = {health:100, stamina:100, moveX:0, moveY:0, yaw:0, pitch:0, safe:false, sprint:false, paused:false, ended:false, inventoryOpen:false};
  const scene = new BABYLON.Scene(engine);
  scene.collisionsEnabled = true;
  scene.clearColor = new BABYLON.Color4(0.48,0.66,0.77,1);
  scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
  scene.fogDensity = 0.006;
  scene.fogColor = new BABYLON.Color3(0.48,0.66,0.77);
  const camera = new BABYLON.FollowCamera("follow", new BABYLON.Vector3(0,5,10), scene);
  camera.radius = 8; camera.heightOffset = 3.1; camera.rotationOffset = 180; camera.cameraAcceleration = 0.08; camera.maxCameraSpeed = 8;
  camera.attachControl(canvas, true);
  const light = new BABYLON.HemisphericLight("sky", new BABYLON.Vector3(0,1,0), scene); light.intensity = 0.9;
  const sun = new BABYLON.DirectionalLight("sun", new BABYLON.Vector3(-0.4,-1,0.3), scene); sun.position = new BABYLON.Vector3(20,35,-20); sun.intensity = 0.75;
  const mat = (name,color) => {const m=new BABYLON.StandardMaterial(name,scene);m.diffuseColor=BABYLON.Color3.FromHexString(color);return m;};
  const road=mat("road","#343b40"), pavement=mat("pavement","#777b78"), wallA=mat("wallA","#b6a58c"), wallB=mat("wallB","#87949a"), windowMat=mat("windows","#344c59"), heroMat=mat("hero","#183f65"), skin=mat("skin","#b98462"), zombieMat=mat("zombie","#667d58"), zombieSkin=mat("zombieSkin","#8b9270"), zombieCloth=mat("zombieCloth","#4d594c"), zombieDark=mat("zombieDark","#29342f"), supplyMat=mat("supply","#d9a83e"), safeMat=mat("safe","#35c979"), pantsMat=mat("pants","#263443"), bootMat=mat("boots","#302a25"), hairMat=mat("hair","#17191b"), shirtMat=mat("shirt","#d2d0c7"), packMat=mat("pack","#8b6844");
  const ground=BABYLON.MeshBuilder.CreateGround("ground",{width:130,height:130},scene); ground.material=pavement; ground.checkCollisions=true;
  const street=BABYLON.MeshBuilder.CreateGround("street",{width:15,height:115},scene); street.position.y=.025; street.material=road;
  for(let i=-5;i<=5;i++){const line=BABYLON.MeshBuilder.CreateBox("lane",{width:.12,height:.025,depth:4},scene);line.position.set(0,.06,i*10);line.material=mat("lane"+i,"#d7cfa7");}
  function building(x,z,w,d,h,material){
    const b=BABYLON.MeshBuilder.CreateBox("building",{width:w,height:h,depth:d},scene);b.position.set(x,h/2,z);b.material=material;b.checkCollisions=true;
    const streetSide=x<0?1:-1,faceX=x+streetSide*(w/2+.055),faceRotation=Math.PI/2;
    const frameMat=mat("facadeFrame"+x+z,"#d2c6ad"),doorMat=mat("shopDoor"+x+z,"#4b4035"),awningMat=mat("awning"+x+z,x<0?"#a94f3e":"#326b70"),metalMat=mat("facadeMetal"+x+z,"#4b5357");
    // Street-facing windows with frames, sills and occasional shallow balconies.
    for(let y=2.25;y<h-1;y+=3){
      for(let lane=-1;lane<=1;lane++){
        const wz=z+lane*3.1;
        const frame=BABYLON.MeshBuilder.CreateBox("windowFrame",{width:1.34,height:1.48,depth:.13},scene);frame.position.set(faceX,y,wz);frame.rotation.y=faceRotation;frame.material=frameMat;
        const win=BABYLON.MeshBuilder.CreateBox("windowGlass",{width:1.12,height:1.24,depth:.09},scene);win.position.set(faceX+streetSide*.075,y,wz);win.rotation.y=faceRotation;win.material=windowMat;
        const sill=BABYLON.MeshBuilder.CreateBox("windowSill",{width:1.48,height:.09,depth:.25},scene);sill.position.set(faceX+streetSide*.16,y-.77,wz);sill.rotation.y=faceRotation;sill.material=frameMat;
        if(y>3.5&&lane===0){
          const balcony=BABYLON.MeshBuilder.CreateBox("balconySlab",{width:2.05,height:.12,depth:1.55},scene);balcony.position.set(faceX+streetSide*.58,y-.92,wz);balcony.material=metalMat;
          const rail=BABYLON.MeshBuilder.CreateBox("balconyRail",{width:1.95,height:.48,depth:.07},scene);rail.position.set(faceX+streetSide*1.22,y-.66,wz);rail.rotation.y=faceRotation;rail.material=frameMat;
          for(let post=-2;post<=2;post++){const bar=BABYLON.MeshBuilder.CreateBox("balconyBar",{width:.045,height:.46,depth:.07},scene);bar.position.set(faceX+streetSide*1.22,y-.66,wz+post*.38);bar.material=metalMat;}
        }
      }
    }
    // Shopfront entrance, sign panel and canopy at street level.
    const door=BABYLON.MeshBuilder.CreateBox("shopDoor",{width:1.25,height:2.25,depth:.16},scene);door.position.set(faceX+streetSide*.11,1.13,z-2.35);door.rotation.y=faceRotation;door.material=doorMat;
    const sign=BABYLON.MeshBuilder.CreateBox("shopSign",{width:3.8,height:.55,depth:.18},scene);sign.position.set(faceX+streetSide*.14,3.05,z);sign.rotation.y=faceRotation;sign.material=awningMat;
    const canopy=BABYLON.MeshBuilder.CreateBox("shopCanopy",{width:4.2,height:.13,depth:1.15},scene);canopy.position.set(faceX+streetSide*.62,2.65,z);canopy.material=awningMat;
    for(let post=-1;post<=1;post+=2){const support=BABYLON.MeshBuilder.CreateBox("canopySupport",{width:.09,height:1.15,depth:.09},scene);support.position.set(faceX+streetSide*1.05,2.05,z+post*1.9);support.material=metalMat;}
    // Rooftop parapet and water tank details typical of the neighbourhood skyline.
    const parapet=BABYLON.MeshBuilder.CreateBox("roofParapet",{width:w+.35,height:.55,depth:d+.35},scene);parapet.position.set(x,h+.18,z);parapet.material=frameMat;
    const tank=BABYLON.MeshBuilder.CreateCylinder("roofWaterTank",{diameter:1.5,height:1.9,tessellation:16},scene);tank.position.set(x+streetSide*1.7,h+1.15,z+2.1);tank.material=metalMat;
  }
  for(let z=-45;z<=45;z+=18){building(-13,z,10,12,9+(Math.abs(z)%3)*2,wallA);building(13,z,10,12,11,wallB);}
  // Collision boundaries keep the player inside the playable street block.
  for(const x of [-7.6,7.6]){const wall=BABYLON.MeshBuilder.CreateBox("streetBoundary",{width:.5,height:4,depth:120},scene);wall.position.set(x,2,0);wall.checkCollisions=true;wall.visibility=0.001;}
  for(const z of [-58,58]){const wall=BABYLON.MeshBuilder.CreateBox("streetEndBoundary",{width:15.5,height:4,depth:.5},scene);wall.position.set(0,2,z);wall.checkCollisions=true;wall.isVisible=false;}
  const player=BABYLON.MeshBuilder.CreateCapsule("playerCollider",{height:1.9,radius:.42},scene);player.material=heroMat;player.visibility=0.001;player.position.set(0,.95,35);player.checkCollisions=true;player.ellipsoid=new BABYLON.Vector3(.42,.95,.42);camera.lockedTarget=player;
  // Original modular hero blockout with articulated limbs and layered clothing.
  const heroParts=[];
  const part=(name,mesh,material,parent=player)=>{mesh.name=name;mesh.material=material;mesh.parent=parent;heroParts.push(mesh);return mesh;};
  const torso=part("hero-jacket",BABYLON.MeshBuilder.CreateBox("heroJacket",{width:.62,height:.82,depth:.34},scene),heroMat);torso.position.set(0,.13,0);
  const shirt=part("hero-shirt",BABYLON.MeshBuilder.CreateBox("heroShirt",{width:.3,height:.48,depth:.035},scene),shirtMat);shirt.position.set(0,.13,.183);
  const head=part("hero-head",BABYLON.MeshBuilder.CreateSphere("heroHead",{diameter:.43,segments:20},scene),skin);head.position.set(0,.78,0);
  const hair=part("hero-hair",BABYLON.MeshBuilder.CreateSphere("heroHair",{diameter:.445,segments:16},scene),hairMat);hair.position.set(0,.91,-.015);hair.scaling.y=.55;
  // Facial features and layered field clothing make the hero silhouette readable at gameplay distance.
  for(const side of [-1,1]){
    const ear=part("hero-ear",BABYLON.MeshBuilder.CreateSphere("heroEar",{diameter:.105,segments:10},scene),skin);ear.position.set(side*.205,.78,0);
    const eyeWhite=part("hero-eye",BABYLON.MeshBuilder.CreateSphere("heroEye",{diameter:.075,segments:10},scene),shirtMat);eyeWhite.position.set(side*.083,.81,.183);
    const pupil=part("hero-pupil",BABYLON.MeshBuilder.CreateSphere("heroPupil",{diameter:.032,segments:8},scene),hairMat);pupil.position.set(side*.083,.81,.216);
    const brow=part("hero-brow",BABYLON.MeshBuilder.CreateBox("heroBrow",{width:.105,height:.025,depth:.025},scene),hairMat);brow.position.set(side*.083,.865,.18);
    const shoulder=part("hero-shoulder-pad",BABYLON.MeshBuilder.CreateBox("heroShoulder",{width:.22,height:.16,depth:.38},scene),pantsMat);shoulder.position.set(side*.34,.42,0);
    const strap=part("hero-backpack-strap",BABYLON.MeshBuilder.CreateBox("heroStrap",{width:.065,height:.58,depth:.045},scene),packMat);strap.position.set(side*.19,.2,.19);strap.rotation.z=side*-.16;
  }
  const nose=part("hero-nose",BABYLON.MeshBuilder.CreateSphere("heroNose",{diameter:.075,segments:8},scene),skin);nose.position.set(0,.765,.205);nose.scaling.z=1.35;
  const belt=part("hero-utility-belt",BABYLON.MeshBuilder.CreateBox("heroBelt",{width:.64,height:.1,depth:.36},scene),bootMat);belt.position.set(0,-.24,0);
  const buckle=part("hero-buckle",BABYLON.MeshBuilder.CreateBox("heroBuckle",{width:.12,height:.09,depth:.035},scene),supplyMat);buckle.position.set(0,-.24,.19);
  const pack=part("hero-backpack",BABYLON.MeshBuilder.CreateBox("heroPack",{width:.4,height:.52,depth:.19},scene),packMat);pack.position.set(0,.18,-.25);
  const limb=(name,x,y,material,length,radius)=>{const pivot=new BABYLON.TransformNode(name+"Pivot",scene);pivot.parent=player;pivot.position.set(x,y,0);const mesh=part(name,BABYLON.MeshBuilder.CreateCylinder(name+"Mesh",{height:length,diameter:radius*2,tessellation:10},scene),material,pivot);mesh.position.y=-length/2;return pivot;};
  const leftArm=limb("hero-left-arm",-.39,.42,heroMat,.67,.115),rightArm=limb("hero-right-arm",.39,.42,heroMat,.67,.115);
  const leftLeg=limb("hero-left-leg",-.17,-.3,pantsMat,.72,.14),rightLeg=limb("hero-right-leg",.17,-.3,pantsMat,.72,.14);
  const leftBoot=part("hero-left-boot",BABYLON.MeshBuilder.CreateBox("heroLeftBoot",{width:.22,height:.16,depth:.34},scene),bootMat);leftBoot.position.set(-.17,-.79,.07);
  const rightBoot=part("hero-right-boot",BABYLON.MeshBuilder.CreateBox("heroRightBoot",{width:.22,height:.16,depth:.34},scene),bootMat);rightBoot.position.set(.17,-.79,.07);
  const heroRig={leftArm,rightArm,leftLeg,rightLeg,heroParts};
  const safe=BABYLON.MeshBuilder.CreateCylinder("safeZone",{diameter:5,height:.12,tessellation:48},scene);safe.position.set(0,.12,-43);safe.material=safeMat;
  // Original low-poly walker characters: layered torso, head, face, articulated arms and legs.
  function createWalker(i){
    const root=BABYLON.MeshBuilder.CreateCapsule("walkerCollider"+i,{height:1.85,radius:.4},scene);
    root.material=zombieMat;root.visibility=.001;root.position.set((i%2?1:-1)*(3.5+i*.45),1,-10-i*7);
    const archetypes=[
      {name:"WANDERER",speed:1.35,detect:25,scale:1,cloth:"#53634d"},
      {name:"SPRINTER",speed:2.55,detect:31,scale:.92,cloth:"#6b5946"},
      {name:"GUARDIAN",speed:.92,detect:22,scale:1.22,cloth:"#394d5a"},
      {name:"SCOUT",speed:1.8,detect:34,scale:.88,cloth:"#625c43"},
      {name:"ALPHA",speed:1.15,detect:30,scale:1.38,cloth:"#51465d"}
    ];
    const archetype=archetypes[i%archetypes.length];
    root.scaling.setAll(archetype.scale);root.metadata={archetype:archetype.name,speed:archetype.speed,detectionRange:archetype.detect};
    const variantCloth=mat("walkerCloth"+i,archetype.cloth);
    const piece=(name,mesh,material,parent=root)=>{mesh.name=name;mesh.material=material;mesh.parent=parent;return mesh;};
    const torso=piece("walkerTorso",BABYLON.MeshBuilder.CreateBox("walkerTorso",{width:.58,height:.76,depth:.32},scene),variantCloth);torso.position.y=.08;
    const chest=piece("walkerChest",BABYLON.MeshBuilder.CreateBox("walkerChest",{width:.38,height:.34,depth:.035},scene),zombieMat);chest.position.set(0,.13,.17);
    const head=piece("walkerHead",BABYLON.MeshBuilder.CreateSphere("walkerHead",{diameter:.4,segments:12},scene),zombieSkin);head.position.y=.7;
    const hair=piece("walkerHair",BABYLON.MeshBuilder.CreateSphere("walkerHair",{diameter:.41,segments:10},scene),zombieDark);hair.position.set(0,.83,-.015);hair.scaling.y=.45;
    for(const side of [-1,1]){
      const eye=piece("walkerEye",BABYLON.MeshBuilder.CreateSphere("walkerEye",{diameter:.045,segments:8},scene),zombieDark);eye.position.set(side*.085,.72,.18);
    }
    const limb=(name,x,y,length,material)=>{
      const pivot=new BABYLON.TransformNode(name+"Pivot",scene);pivot.parent=root;pivot.position.set(x,y,0);
      const mesh=piece(name,BABYLON.MeshBuilder.CreateCylinder(name+"Mesh",{height:length,diameter:name.includes("arm")?.19:.23,tessellation:10},scene),material,pivot);mesh.position.y=-length/2;
      return pivot;
    };
    const leftArm=limb("walkerLeftArm",-.35,.37,.65,zombieSkin),rightArm=limb("walkerRightArm",.35,.37,.65,zombieSkin);
    const leftLeg=limb("walkerLeftLeg",-.15,-.29,.7,zombieDark),rightLeg=limb("walkerRightLeg",.15,-.29,.7,zombieDark);
    for(const side of [-1,1]){
      const boot=piece("walkerBoot",BABYLON.MeshBuilder.CreateBox("walkerBoot",{width:.22,height:.15,depth:.3},scene),zombieDark);boot.position.set(side*.15,-.78,.055);
    }
    root.rig={leftArm,rightArm,leftLeg,rightLeg,phase:i*.83};
    return root;
  }
  const zombies=Array.from({length:5},(_,i)=>createWalker(i));
  // Collectible supply crates create a short, repeatable survival objective before the safe zone.
  const pickups=[];
  for(let i=0;i<4;i++){
    const crate=BABYLON.MeshBuilder.CreateBox("supplyCrate"+i,{width:.72,height:.62,depth:.62},scene);crate.material=supplyMat;crate.position.set(i%2===0?-2.1:2.1,.42,24-i*15);
    const band=BABYLON.MeshBuilder.CreateBox("supplyBand"+i,{width:.76,height:.09,depth:.12},scene);band.material=bootMat;band.parent=crate;band.position.y=.05;
    const marker=BABYLON.MeshBuilder.CreateCylinder("supplyMarker"+i,{diameter:1.05,height:.035,tessellation:24},scene);marker.material=safeMat;marker.position.set(crate.position.x,.04,crate.position.z);
    pickups.push({mesh:crate,marker,collected:false,phase:i});
  }
  // First drivable street car: simple original low-poly sedan with enter/exit and mobile controls.
  const vehicle=BABYLON.MeshBuilder.CreateBox("sedanCollider",{width:1.9,height:.85,depth:3.5},scene);
  vehicle.position.set(3.3,.58,31);vehicle.material=heroMat;vehicle.visibility=.001;vehicle.checkCollisions=true;
  const vehicleParts=[];
  const vehiclePart=(mesh,material,pos)=>{mesh.parent=vehicle;mesh.material=material;mesh.position.copyFrom(pos);vehicleParts.push(mesh);return mesh;};
  vehiclePart(BABYLON.MeshBuilder.CreateBox("sedanBody",{width:1.85,height:.55,depth:3.35},scene),mat("sedanPaint","#315f78"),new BABYLON.Vector3(0,-.03,0));
  vehiclePart(BABYLON.MeshBuilder.CreateBox("sedanCabin",{width:1.48,height:.68,depth:1.75},scene),windowMat,new BABYLON.Vector3(0,.53,-.12));
  vehiclePart(BABYLON.MeshBuilder.CreateBox("sedanRoof",{width:1.52,height:.12,depth:1.82},scene),mat("sedanRoof","#24445a"),new BABYLON.Vector3(0,.9,-.12));
  for(const side of [-1,1])for(const z of [-1.12,1.12]){
    const wheel=BABYLON.MeshBuilder.CreateCylinder("sedanWheel",{diameter:.62,height:.2,tessellation:16},scene);wheel.rotation.z=Math.PI/2;
    vehiclePart(wheel,bootMat,new BABYLON.Vector3(side*.91,-.28,z));
  }
  vehiclePart(BABYLON.MeshBuilder.CreateBox("sedanFrontLight",{width:.42,height:.18,depth:.06},scene),shirtMat,new BABYLON.Vector3(-.52,.12,1.7));
  vehiclePart(BABYLON.MeshBuilder.CreateBox("sedanFrontLight",{width:.42,height:.18,depth:.06},scene),shirtMat,new BABYLON.Vector3(.52,.12,1.7));
  let driving=false;
  const driveButton=document.getElementById("drive");
  function toggleVehicle(){
    if(state.paused||state.ended)return;
    if(!driving&&BABYLON.Vector3.Distance(player.position,vehicle.position)<4.3){
      driving=true;player.setEnabled(false);camera.lockedTarget=vehicle;
      document.getElementById("status").textContent="Driving sedan — use joystick or WASD, press E / EXIT to leave.";
      driveButton.textContent="EXIT";
    }else if(driving){
      driving=false;player.position.copyFrom(vehicle.position);player.position.x+=1.45;player.position.y=.95;
      player.rotation.y=vehicle.rotation.y;player.setEnabled(true);camera.lockedTarget=player;
      document.getElementById("status").textContent="On foot — approach the sedan and press E to drive.";
      driveButton.textContent="DRIVE";
    }
  }
  driveButton.addEventListener("click",toggleVehicle);
  const SAVE_KEY="cvirus-zombies-save-v1";
  let savedGame=null;
  try{savedGame=JSON.parse(localStorage.getItem(SAVE_KEY)||"null");}catch{savedGame=null;}
  state.supplies=Number.isInteger(savedGame?.supplies)?Math.max(0,Math.min(4,savedGame.supplies)):0;
  state.inventory={water:0,food:0,medicine:0,parts:0,...(savedGame?.inventory||{})};
  for(const key of ["water","food","medicine","parts"])state.inventory[key]=Number.isInteger(state.inventory[key])?Math.max(0,Math.min(99,state.inventory[key])):0;
  state.safe=savedGame?.missionComplete===true;
  state.health=Number.isFinite(savedGame?.health)?BABYLON.Scalar.Clamp(savedGame.health,1,100):100;
  if(Array.isArray(savedGame?.vehicle)&&savedGame.vehicle.length===3&&savedGame.vehicle.every(Number.isFinite))vehicle.position.set(savedGame.vehicle[0],.58,savedGame.vehicle[2]);
  if(Array.isArray(savedGame?.player)&&savedGame.player.length===3&&savedGame.player.every(Number.isFinite)){
    player.position.set(savedGame.player[0],.95,savedGame.player[2]);
    // A save made while driving stores the hero at the vehicle position.
    // Restore the hero beside the sedan so the player is not trapped inside it.
    if(BABYLON.Vector3.Distance(player.position,vehicle.position)<2.1){
      player.position.x=vehicle.position.x+2.2;
      player.position.z=vehicle.position.z;
    }
  }
  if(Number.isFinite(savedGame?.yaw))state.yaw=savedGame.yaw;
  pickups.forEach(p=>{
    if(Array.isArray(savedGame?.collected)&&savedGame.collected.includes(p.phase)){
      p.collected=true;p.mesh.setEnabled(false);p.marker.setEnabled(false);
    }
  });
  document.getElementById("supplies").textContent=String(state.supplies);
  document.getElementById("health").style.width=state.health+"%";
  const inventoryPanel=document.getElementById("inventory-panel");
  function updateInventory(){
    for(const key of ["water","food","medicine","parts"])document.getElementById("item-"+key).textContent=String(state.inventory[key]);
    document.getElementById("use-medicine").disabled=state.inventory.medicine<1||state.health>=100;
    document.getElementById("use-water").disabled=state.inventory.water<1||state.stamina>=100;
    document.getElementById("use-food").disabled=state.inventory.food<1||state.stamina>=100;
  }
  function consumeSupply(item){
    if(state.inventory[item]<1)return;
    if(item==="medicine"&&state.health<100){state.inventory.medicine--;state.health=Math.min(100,state.health+30);document.getElementById("health").style.width=state.health+"%";document.getElementById("status").textContent="Medicine used — health restored.";}
    else if(item==="water"&&state.stamina<100){state.inventory.water--;state.stamina=Math.min(100,state.stamina+35);document.getElementById("stamina").style.width=state.stamina+"%";document.getElementById("status").textContent="Water used — stamina restored.";}
    else if(item==="food"&&state.stamina<100){state.inventory.food--;state.stamina=Math.min(100,state.stamina+25);document.getElementById("stamina").style.width=state.stamina+"%";document.getElementById("status").textContent="Food used — stamina restored.";}
    else return;
    updateInventory();saveProgress();
  }
  document.getElementById("use-medicine").addEventListener("click",()=>consumeSupply("medicine"));
  document.getElementById("use-water").addEventListener("click",()=>consumeSupply("water"));
  document.getElementById("use-food").addEventListener("click",()=>consumeSupply("food"));
  updateInventory();
  const inventoryButton=document.getElementById("inventory-button");
  inventoryButton.addEventListener("click",()=>{inventoryPanel.hidden=!inventoryPanel.hidden;state.inventoryOpen=!inventoryPanel.hidden;if(state.inventoryOpen){state.sprint=false;touchX=0;touchY=0;reset();saveProgress();}});
  const endOverlay=document.getElementById("end-overlay");
  const endTitle=document.getElementById("end-title");
  const endText=document.getElementById("end-text");
  if(state.safe){state.ended=true;endOverlay.hidden=false;endTitle.textContent="MISSION COMPLETE";endText.textContent="You reached the safe zone with all supplies.";document.getElementById("message").textContent="Mission complete — supplies secured!";document.getElementById("status").textContent="Safe zone secured. All supplies collected.";} 
  function saveProgress(){
    try{
      localStorage.setItem(SAVE_KEY,JSON.stringify({
        health:state.health,supplies:state.supplies,inventory:state.inventory,yaw:state.yaw,missionComplete:state.safe,
        player:[player.position.x,player.position.y,player.position.z],
        vehicle:[vehicle.position.x,vehicle.position.y,vehicle.position.z],
        collected:pickups.filter(p=>p.collected).map(p=>p.phase)
      }));
    }catch(error){console.warn("Save unavailable:",error);}
  }
  window.addEventListener("pagehide",saveProgress);
  let saveClock=0, damageTimer=0, touchX=0, touchY=0, verticalVelocity=0, grounded=true, jumpCooldown=0;
  // Read-only debug surface used by the automated browser smoke test.
  window.__CVIRUS_DEBUG__={engine,scene,player,zombies,safe,state,heroRig,pickups,vehicle,get driving(){return driving;}};
  let worldClock=0;
  let subtitleTimer=null;
  const subtitlePanel=document.getElementById("subtitles");
  function showSubtitle(urdu,translation,duration=4200){
    document.getElementById("subtitle-urdu").textContent=urdu;
    document.getElementById("subtitle-translation").textContent=translation;
    subtitlePanel.hidden=false;
    if(subtitleTimer)clearTimeout(subtitleTimer);
    subtitleTimer=setTimeout(()=>{subtitlePanel.hidden=true;},duration);
  }
  showSubtitle("شہر میں وائرس پھیل چکا ہے۔ محفوظ مقام تک پہنچنا ہوگا۔","The city is infected. Reach the safe zone.",5200);
  setTimeout(()=>showSubtitle("ریڈیو: چاروں سپلائی کریٹس جمع کریں، پھر سبز محفوظ مقام پر جائیں۔","RADIO: Collect all four supply crates, then reach the green safe zone.",5200),5600);
  scene.onBeforeRenderObservable.add(()=>{
    if(state.paused||state.ended||state.inventoryOpen)return;
    const dt=Math.min(engine.getDeltaTime()/1000,.04);
    worldClock+=dt;
    const daylight=(Math.sin(worldClock/90*Math.PI*2-Math.PI/2)+1)/2;
    sun.intensity=.16+daylight*.72;
    light.intensity=.42+daylight*.52;
    scene.fogDensity=.0045+(1-daylight)*.0035;
    scene.clearColor=new BABYLON.Color4(.035+daylight*.45,.055+daylight*.60,.09+daylight*.67,1);
    saveClock+=dt;if(saveClock>=5){saveClock=0;saveProgress();}
    const moving=state.moveX*state.moveX+state.moveY*state.moveY>.025;
    const gait=moving?Math.sin(performance.now()*.012*(state.sprint?1.35:1)):0;
    heroRig.leftLeg.rotation.x=gait*.62;heroRig.rightLeg.rotation.x=-gait*.62;heroRig.leftArm.rotation.x=-gait*.48;heroRig.rightArm.rotation.x=gait*.48;
    zombies.forEach(z=>{
      const zMoving=!state.safe&&state.health>0&&BABYLON.Vector3.Distance(player.position,z.position)<z.metadata.detectionRange;
      z.rig.phase+=dt*(zMoving?5.2:1.4);
      const walk=Math.sin(z.rig.phase)*.48;
      z.rig.leftLeg.rotation.x=walk;z.rig.rightLeg.rotation.x=-walk;
      z.rig.leftArm.rotation.x=-walk*.8+.18;z.rig.rightArm.rotation.x=walk*.8+.18;
    });
    pickups.forEach(p=>{
      if(p.collected)return;
      p.mesh.rotation.y+=dt*.65;p.marker.rotation.y-=dt*.8;
      if(BABYLON.Vector3.Distance(player.position,p.mesh.position)<1.65){
        p.collected=true;p.mesh.setEnabled(false);p.marker.setEnabled(false);
        state.supplies+=1;
        const itemTypes=["water","food","medicine","parts"];state.inventory[itemTypes[p.phase]]+=1;
        state.health=Math.min(100,state.health+8);
        updateInventory();
        document.getElementById("supplies").textContent=String(state.supplies);
        document.getElementById("health").style.width=state.health+"%";
        document.getElementById("status").textContent="Supplies collected: "+state.supplies+"/4 — reach the safe zone.";showSubtitle("سپلائی مل گئی۔ محفوظ مقام کی طرف بڑھیں۔","Supply secured. Keep moving toward the safe zone.",2200);
        saveProgress();
      }
    });
    const forward=new BABYLON.Vector3(Math.sin(state.yaw),0,-Math.cos(state.yaw));
    const right=new BABYLON.Vector3(-forward.z,0,forward.x);
    const move=forward.scale(-state.moveY).add(right.scale(state.moveX));
    if(move.lengthSquared()>1)move.normalize();
    jumpCooldown=Math.max(0,jumpCooldown-dt);
    if(move.lengthSquared()>0.001&&!state.safe&&state.health>0){move.normalize();player.rotation.y=Math.atan2(move.x,move.z);}
    if(driving){
      const vehicleMove=forward.scale(-state.moveY).add(right.scale(state.moveX));
      if(vehicleMove.lengthSquared()>1)vehicleMove.normalize();
      if(vehicleMove.lengthSquared()>.001){vehicle.rotation.y=Math.atan2(vehicleMove.x,vehicleMove.z);const driveSpeed=state.sprint?10:6.2;vehicle.moveWithCollisions(vehicleMove.scale(driveSpeed*dt));}
      player.position.copyFrom(vehicle.position);
    }
    if(!driving&&!state.safe&&state.health>0){
      const wantsSprint=(state.sprint||keys.shift)&&move.lengthSquared()>.01&&state.stamina>1;
      if(wantsSprint)state.stamina=Math.max(0,state.stamina-27*dt);
      else state.stamina=Math.min(100,state.stamina+18*dt);
      const speed=wantsSprint?8.2:5.2;
      verticalVelocity-=19*dt;
      player.moveWithCollisions(new BABYLON.Vector3(move.x*speed*dt,verticalVelocity*dt,move.z*speed*dt));
      if(player.position.y<=.97&&verticalVelocity<=0){player.position.y=.95;verticalVelocity=0;grounded=true;}
      else if(player.position.y>.97){grounded=false;}
      const staminaBar=document.getElementById("stamina");
      if(staminaBar)staminaBar.style.width=state.stamina+"%";
    }
    let near=false;
    zombies.forEach(z=>{if(state.safe||state.health<=0)return;const delta=player.position.subtract(z.position);delta.y=0;const dist=delta.length();if(!driving&&dist>1.25&&dist<z.metadata.detectionRange){delta.normalize();z.position.addInPlace(delta.scale(z.metadata.speed*dt));z.rotation.y=Math.atan2(delta.x,delta.z);}if(dist<1.7)near=true;});
    if(near&&!driving&&!state.safe&&state.health>0){damageTimer+=dt;if(damageTimer>.45){state.health=Math.max(0,state.health-3);damageTimer=0;document.getElementById("health").style.width=state.health+"%";}}
    const reached=BABYLON.Vector3.Distance(driving?vehicle.position:player.position,safe.position)<3;
    if(reached&&!state.safe&&state.supplies===4){state.safe=true;document.getElementById("message").textContent="Safe zone reached — mission complete!";document.getElementById("status").textContent="Mission complete. All 4 supplies secured.";endTitle.textContent="MISSION COMPLETE";endText.textContent="You reached the safe zone with all supplies.";endOverlay.hidden=false;showSubtitle("ہم محفوظ مقام تک پہنچ گئے! مشن مکمل۔","Safe zone reached. Mission complete.",5000);saveProgress();}
    else if(reached&&!state.safe){document.getElementById("message").textContent="Safe zone ahead — collect all 4 supplies first.";document.getElementById("status").textContent="Supplies secured: "+state.supplies+"/4. Find the remaining crates.";}
    if(state.health<=0&&!state.safe&&!state.ended){state.ended=true;document.getElementById("message").textContent="Health depleted — mission failed";document.getElementById("status").textContent="Mission failed. Retry to start again.";endTitle.textContent="MISSION FAILED";endText.textContent="Try a different route and collect the supplies.";endOverlay.hidden=false;}
  });
  // Keyboard controls
  const keys={};
  const pauseOverlay=document.getElementById("pause-overlay");
  const pauseButton=document.getElementById("pause-button");
  const resumeButton=document.getElementById("resume-button");
  function setPaused(value){
    state.paused=!!value;pauseOverlay.hidden=!state.paused;
    if(state.paused){state.sprint=false;touchX=0;touchY=0;reset();saveProgress();}
  }
  pauseButton.addEventListener("click",()=>setPaused(!state.paused));
  resumeButton.addEventListener("click",()=>setPaused(false));
  document.getElementById("retry-button").addEventListener("click",()=>{localStorage.removeItem(SAVE_KEY);window.location.reload();});
  const doJump=()=>{if(grounded&&jumpCooldown===0&&!state.safe&&state.health>0){verticalVelocity=7.2;grounded=false;jumpCooldown=.22;}};
  window.addEventListener("keydown",e=>{if(e.key.toLowerCase()==="e"){toggleVehicle();return;}if(e.key==="Escape"){if(state.inventoryOpen){state.inventoryOpen=false;inventoryPanel.hidden=true;}else setPaused(!state.paused);return;}const key=e.key.toLowerCase();if(key==="i"){inventoryPanel.hidden=!inventoryPanel.hidden;state.inventoryOpen=!inventoryPanel.hidden;if(state.inventoryOpen){state.sprint=false;touchX=0;touchY=0;reset();saveProgress();}return;}if(state.paused||!inventoryPanel.hidden)return;if(["arrowup","arrowdown","arrowleft","arrowright"," "].includes(key))e.preventDefault();keys[key]=true;if(e.code==="Space")doJump();});
  window.addEventListener("keyup",e=>keys[e.key.toLowerCase()]=false);
  window.addEventListener("blur",()=>{for(const key in keys)keys[key]=false;state.sprint=false;});
  engine.runRenderLoop(()=>{const keyX=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0);const keyY=(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0);state.moveX=touchX!==0?touchX:keyX;state.moveY=touchY!==0?touchY:keyY;scene.render();});
  // Touch joystick
  const stick=document.getElementById("stick"),knob=document.getElementById("knob");let active=false;
  const sprintButton=document.getElementById("sprint"),jumpButton=document.getElementById("jump");
  sprintButton.addEventListener("pointerdown",e=>{state.sprint=true;sprintButton.setPointerCapture(e.pointerId);});
  const stopSprint=()=>state.sprint=false;sprintButton.addEventListener("pointerup",stopSprint);sprintButton.addEventListener("pointercancel",stopSprint);sprintButton.addEventListener("lostpointercapture",stopSprint);
  const jump=doJump;
  jumpButton.addEventListener("pointerdown",jump);
  function joystick(e){const r=stick.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let dx=e.clientX-cx,dy=e.clientY-cy;const max=36,len=Math.hypot(dx,dy)||1;if(len>max){dx=dx/len*max;dy=dy/len*max;}knob.style.transform="translate("+dx+"px,"+dy+"px)";touchX=dx/max;touchY=dy/max;}
  stick.addEventListener("pointerdown",e=>{active=true;stick.setPointerCapture(e.pointerId);joystick(e);});
  stick.addEventListener("pointermove",e=>{if(active)joystick(e);});
  const reset=()=>{active=false;knob.style.transform="";touchX=0;touchY=0;};
  stick.addEventListener("pointerup",reset);stick.addEventListener("pointercancel",reset);
  // Drag on right side to rotate the follow camera.
  let look=null;canvas.addEventListener("pointerdown",e=>{if(e.clientX>innerWidth*.42)look={x:e.clientX,y:e.clientY};});
  canvas.addEventListener("pointermove",e=>{if(!look)return;state.yaw-=(e.clientX-look.x)*.006;camera.rotationOffset=180+state.yaw*180/Math.PI;camera.heightOffset=BABYLON.Scalar.Clamp(camera.heightOffset+(e.clientY-look.y)*.018,2.2,5.5);look={x:e.clientX,y:e.clientY};});
  canvas.addEventListener("pointerup",()=>look=null);canvas.addEventListener("pointercancel",()=>look=null);
  canvas.addEventListener("wheel",e=>{camera.radius=BABYLON.Scalar.Clamp(camera.radius+Math.sign(e.deltaY)*.7,5,12);},{passive:true});
  document.addEventListener("visibilitychange",()=>{if(document.hidden){state.sprint=false;touchX=0;touchY=0;reset();}});
  window.addEventListener("resize",()=>engine.resize());
})();
