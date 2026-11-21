(() => {
  const canvas = document.getElementById("game");
  const engine = new BABYLON.Engine(canvas, true, {preserveDrawingBuffer:false, stencil:true, antialias:true});
  const state = {health:100, stamina:100, thirst:100, hunger:100, moveX:0, moveY:0, yaw:0, pitch:0, safe:false, rescued:false, sprint:false, paused:true, ended:false, inventoryOpen:false, storageOpen:false, serviceOpen:false, missionIndex:1, activatedRelays:[],braking:false,crouching:false,shieldUntil:0,shieldCooldownUntil:0};
  // Original procedural audio: ambient survival bed and short gameplay cues.
  const audioSettings={music:0.22,effects:0.55,look:1,quality:"high",...(()=>{try{return JSON.parse(localStorage.getItem("cvirus-audio-v1")||"{}");}catch{return {};}})()};
  let audioContext=null,musicBus=null,effectsBus=null,ambientNodes=[];
  const applyGraphicsQuality=()=>engine.setHardwareScalingLevel(audioSettings.quality==="low"?1.6:audioSettings.quality==="medium"?1.25:1);
  applyGraphicsQuality();
  function initAudio(){
    if(audioContext)return audioContext;
    const AudioCtx=window.AudioContext||window.webkitAudioContext;
    if(!AudioCtx)return null;
    audioContext=new AudioCtx();
    musicBus=audioContext.createGain();musicBus.gain.value=audioSettings.music;musicBus.connect(audioContext.destination);
    effectsBus=audioContext.createGain();effectsBus.gain.value=audioSettings.effects;effectsBus.connect(audioContext.destination);
    const low=audioContext.createOscillator(),high=audioContext.createOscillator(),filter=audioContext.createBiquadFilter(),bed=audioContext.createGain();
    low.type="sine";low.frequency.value=55;high.type="triangle";high.frequency.value=110;
    filter.type="lowpass";filter.frequency.value=420;bed.gain.value=.24;
    low.connect(filter);high.connect(filter);filter.connect(bed);bed.connect(musicBus);
    low.start();high.start();ambientNodes=[low,high,filter,bed];
    return audioContext;
  }
  function playCue(kind="tap"){
    const ctx=initAudio();if(!ctx)return;
    if(ctx.state==="suspended")ctx.resume().catch(()=>{});
    const presets={tap:[520,.055,"sine"],pickup:[740,.16,"triangle"],rescue:[440,.28,"sine"],alert:[170,.2,"sawtooth"],success:[880,.32,"triangle"],horn:[220,.32,"sawtooth"],shield:[330,.42,"sine"],water:[620,.14,"triangle"]};
    const [frequency,duration,type]=presets[kind]||presets.tap;
    const osc=ctx.createOscillator(),gain=ctx.createGain();
    osc.type=type;osc.frequency.setValueAtTime(frequency,ctx.currentTime);
    if(kind==="pickup"||kind==="success")osc.frequency.exponentialRampToValueAtTime(frequency*1.45,ctx.currentTime+duration);
    gain.gain.setValueAtTime(.0001,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.18,ctx.currentTime+.018);gain.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+duration);
    osc.connect(gain);gain.connect(effectsBus);osc.start();osc.stop(ctx.currentTime+duration+.025);
  }
  function playFootstep(sprinting=false){
    const ctx=initAudio();if(!ctx)return;
    if(ctx.state==="suspended")ctx.resume().catch(()=>{});
    const osc=ctx.createOscillator(),gain=ctx.createGain();
    osc.type="triangle";osc.frequency.setValueAtTime(sprinting?112:86,ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(42,ctx.currentTime+.085);
    gain.gain.setValueAtTime(.0001,ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(sprinting?.075:.052,ctx.currentTime+.009);
    gain.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+.095);
    osc.connect(gain);gain.connect(effectsBus);osc.start();osc.stop(ctx.currentTime+.11);
  }
  let engineOscillator=null,engineSoundGain=null,engineAudioActive=null,engineThrottle=0;
  function setEngineAudio(active,throttle=0){
    const ctx=initAudio();if(!ctx)return;
    if(active===engineAudioActive&&Math.abs(throttle-engineThrottle)<.05)return;
    engineAudioActive=active;engineThrottle=throttle;
    if(ctx.state==="suspended")ctx.resume().catch(()=>{});
    if(!engineOscillator){
      engineOscillator=audioContext.createOscillator();engineSoundGain=audioContext.createGain();
      engineOscillator.type="sawtooth";engineOscillator.frequency.value=52;engineSoundGain.gain.value=.0001;
      engineOscillator.connect(engineSoundGain);engineSoundGain.connect(effectsBus);engineOscillator.start();
    }
    engineOscillator.frequency.setTargetAtTime(52+Math.abs(throttle)*95,audioContext.currentTime,.08);
    engineSoundGain.gain.setTargetAtTime(active ? 0.035+Math.abs(throttle)*0.055 : 0.0001,audioContext.currentTime,.12);
  }
  function saveAudioSettings(){try{localStorage.setItem("cvirus-audio-v1",JSON.stringify(audioSettings));}catch{}}
  const settingsPanel=document.getElementById("settings-panel");
  let settingsPausedGame=true;
  function openSettings(){
    settingsPausedGame=state.paused;
    if(!state.paused)setPaused(true);
    initAudio();settingsPanel.hidden=false;playCue("tap");
  }
  function closeSettings(){
    settingsPanel.hidden=true;
    if(!settingsPausedGame)setPaused(false);
    playCue("tap");
  }
  document.getElementById("settings-button").addEventListener("click",openSettings);
  document.getElementById("menu-settings-button").addEventListener("click",openSettings);
  document.getElementById("close-settings").addEventListener("click",closeSettings);
  for(const key of ["music","effects"]){
    const slider=document.getElementById(key+"-volume");
    slider.value=audioSettings[key];
    document.getElementById(key+"-value").textContent=Math.round(audioSettings[key]*100)+"%";
    slider.addEventListener("input",()=>{audioSettings[key]=Number(slider.value);document.getElementById(key+"-value").textContent=Math.round(audioSettings[key]*100)+"%";if(key==="music"&&musicBus)musicBus.gain.value=audioSettings.music;if(key==="effects"&&effectsBus)effectsBus.gain.value=audioSettings.effects;saveAudioSettings();});
  }
  const unlockGameAudio=()=>{const ctx=initAudio();if(ctx&&ctx.state==="suspended")ctx.resume().catch(()=>{});};
  document.addEventListener("pointerdown",unlockGameAudio);
  document.addEventListener("keydown",unlockGameAudio);
  const qualitySelect=document.getElementById("graphics-quality");
  qualitySelect.value=audioSettings.quality;
  qualitySelect.addEventListener("change",()=>{audioSettings.quality=qualitySelect.value;applyGraphicsQuality();saveAudioSettings();});
  const lookSlider=document.getElementById("look-volume");
  lookSlider.value=audioSettings.look;
  document.getElementById("look-value").textContent=Math.round(audioSettings.look*100)+"%";
  lookSlider.addEventListener("input",()=>{audioSettings.look=Number(lookSlider.value);document.getElementById("look-value").textContent=Math.round(audioSettings.look*100)+"%";saveAudioSettings();});

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
  // Extend the narrow starter street into a lightweight Pakistani city grid.
  // Parallel streets and cross streets open up connected neighbourhood blocks.
  for(const x of [-45,-26,26,45]){
    const sideRoad=BABYLON.MeshBuilder.CreateGround("districtRoad",{width:7,height:115},scene);
    sideRoad.position.set(x,.035,0);sideRoad.material=road;
    for(let z=-50;z<=50;z+=20){
      const dash=BABYLON.MeshBuilder.CreateBox("districtLaneMark",{width:.12,height:.025,depth:3.2},scene);
      dash.position.set(x,.065,z);dash.material=mat("districtLaneMarkMat"+x+z,"#d7cfa7");
    }
  }
  for(const z of [0,36]){
    const crossRoad=BABYLON.MeshBuilder.CreateGround("crossStreet",{width:130,height:5},scene);
    crossRoad.position.set(0,.04,z);crossRoad.material=road;
    for(const x of [-58,-42,-24,-8,8,24,42,58]){
      const dash=BABYLON.MeshBuilder.CreateBox("crossLaneMark",{width:3.1,height:.025,depth:.12},scene);
      dash.position.set(x,.07,z);dash.material=mat("crossLaneMarkMat"+x+z,"#d7cfa7");
    }
  }
  function districtBlock(x,z,variant){
    const w=9,d=12,h=7.5+((Math.abs(x)+Math.abs(z))%4)*1.15;
    const body=BABYLON.MeshBuilder.CreateBox("districtBuilding",{width:w,height:h,depth:d},scene);
    body.position.set(x,h/2,z);body.material=variant?wallB:wallA;body.checkCollisions=true;
    const facing=x<0?1:-1;
    const frame=mat("districtFrame"+x+z,"#c8b99f");
    for(const level of [2.1,4.8,7.5]){
      if(level>h-1)continue;
      for(const lane of [-1,1]){
        const wz=z+lane*3;
        const rim=BABYLON.MeshBuilder.CreateBox("districtWindowFrame",{width:1.45,height:1.5,depth:.14},scene);
        rim.position.set(x+facing*(w/2+.06),level,wz);rim.rotation.y=Math.PI/2;rim.material=frame;
        const glass=BABYLON.MeshBuilder.CreateBox("districtWindow",{width:1.2,height:1.22,depth:.1},scene);
        glass.position.set(x+facing*(w/2+.15),level,wz);glass.rotation.y=Math.PI/2;glass.material=windowMat;
      }
    }
    const roof=BABYLON.MeshBuilder.CreateBox("districtRoofRim",{width:w+.25,height:.28,depth:d+.25},scene);
    roof.position.set(x,h+.12,z);roof.material=frame;
  }
  for(const x of [-55,-34.5,34.5,55]){
    for(let z=-45,row=0;z<=45;z+=18,row++)districtBlock(x,z,(row+Math.round(Math.abs(x)))%2);
  }
  // Walk-in interiors placed inside the playable street block. Each room has
  // a real doorway and collidable walls, with its roof omitted for clear play.
  const interiorRooms=[];
  function createInterior(type,x,z){
    const width=5.2,depth=7.2,height=4.1,doorWidth=1.7,side=x<0?1:-1;
    const center=new BABYLON.Vector3(x,0,z),floorMat=mat(type+"Floor","#77756b"),insideWall=mat(type+"Inside","#b8b4a7"),trim=mat(type+"Trim","#5c6668");
    const floor=BABYLON.MeshBuilder.CreateBox(type+"Floor",{width,height:.18,depth},scene);floor.position.set(x,-.09,z);floor.material=floorMat;floor.checkCollisions=true;
    const wall=(name,wx,wy,wz,ww,wh,wd,material=insideWall)=>{
      const m=BABYLON.MeshBuilder.CreateBox(name,{width:ww,height:wh,depth:wd},scene);m.position.set(wx,wy,wz);m.material=material;m.checkCollisions=true;return m;
    };
    wall(type+"BackWall",x, height/2,z-depth/2,width,height,.2);
    wall(type+"FarSideWall",x-side*width/2,height/2,z,.2,height,depth,trim);
    wall(type+"NearSideWall",x+side*width/2,height/2,z,.2,height,depth,trim);
    const segment=(depth-doorWidth)/2;
    wall(type+"FrontWallA",x+side*(width/2-.05),height/2,z-(doorWidth/2+segment/2),.2,height,segment,trim);
    wall(type+"FrontWallB",x+side*(width/2-.05),height/2,z+(doorWidth/2+segment/2),.2,height,segment,trim);
    // Door lintel and visible frame mark the opening without blocking entry.
    wall(type+"DoorLintel",x+side*(width/2-.05),height-.16,z,.2,.32,doorWidth,trim);
    for(const dz of [-doorWidth/2,doorWidth/2])wall(type+"DoorJamb",x+side*(width/2-.05),1.95,z+dz,.22,3.9,.16,mat(type+"DoorFrame","#d8c9a5"));
    const sign=BABYLON.MeshBuilder.CreateBox(type+"Sign",{width:2.5,height:.58,depth:.13},scene);sign.position.set(x+side*(width/2+.12),3.35,z);sign.rotation.y=Math.PI/2;sign.material=mat(type+"SignMat",type==="CLINIC"?"#287f79":type==="SHOP"?"#a65b37":"#315a82");
    const prop=(name,px,py,pz,w,h,d,color)=>{
      const m=BABYLON.MeshBuilder.CreateBox(name,{width:w,height:h,depth:d},scene);m.position.set(px,py,pz);m.material=mat(name+"Mat",color);return m;
    };
    if(type==="CLINIC"){
      prop("clinicBed",x-side*.55,.62,z-.7,1.45,.28,2.35,"#d8ddd8");
      prop("clinicPillow",x-side*.55,.82,z-1.55,.8,.16,.48,"#eef0e9");
      prop("clinicCabinet",x-side*1.55,1.05,z+2.1,.65,2.0,.75,"#d7d1bd");
      prop("clinicCounter",x+side*.7,.62,z+2.55,1.35,.25,.75,"#806c55");
      prop("clinicCross",x+side*.15,2.8,z-depth/2+.18,.7,.7,.12,"#2b9b73");
    }else if(type==="SHOP"){
      for(let i=0;i<3;i++)prop("shopShelf"+i,x-side*1.55,1.3,z-2.1+i*1.8,.38,2.5,1.1,"#806044");
      prop("shopCounter",x+side*.75,.65,z+2.45,1.5,.3,.8,"#79583c");
      for(let i=0;i<5;i++)prop("shopGoods"+i,x-side*1.52,2.15,z-2.1+i*1.05,.42,.35,.42,"#c39a4d");
    }else{
      prop("policeDesk",x-side*.65,.68,z-.65,2.0,.32,.95,"#594a3d");
      prop("policeCabinet",x+side*1.55,1.2,z+2.0,.65,2.3,.8,"#52606b");
      prop("policeBench",x-side*.65,.5,z+2.3,1.8,.18,.55,"#786b58");
      prop("policeBadge",x+side*.15,2.8,z-depth/2+.18,.85,.65,.12,"#d3b34a");
    }
    interiorRooms.push({type,center,door:new BABYLON.Vector3(x+side*(width/2),0,z)});
  }
  createInterior("CLINIC",-4.8,18);
  createInterior("SHOP",4.8,-13);
  createInterior("POLICE",-4.8,-35);
  // Survivor safe-house hub and persistent supply storage.
  const safehouseCenter=new BABYLON.Vector3(8,0,-55);
  const serviceCenter=new BABYLON.Vector3(18,0,-55);
  const servicePad=BABYLON.MeshBuilder.CreateCylinder("vehicleServicePad",{diameter:7.2,height:.12,tessellation:32},scene);servicePad.position.set(serviceCenter.x,.06,serviceCenter.z);servicePad.material=mat("servicePadMat","#3d625a");
  const pumpBase=BABYLON.MeshBuilder.CreateBox("fuelPumpBase",{width:.8,height:1.1,depth:.65},scene);pumpBase.position.set(19.6,.62,-55);pumpBase.material=mat("fuelPumpPaint","#d5bd4c");
  const pumpScreen=BABYLON.MeshBuilder.CreateBox("fuelPumpScreen",{width:.48,height:.26,depth:.035},scene);pumpScreen.position.set(19.6,.88,-54.66);pumpScreen.material=mat("fuelPumpScreenMat","#183b3b");
  const serviceSign=BABYLON.MeshBuilder.CreateBox("serviceSign",{width:3.2,height:.7,depth:.12},scene);serviceSign.position.set(18,2.5,-58.3);serviceSign.material=mat("serviceSignMat","#245c50");
  const baseFloor=BABYLON.MeshBuilder.CreateBox("safehouseFloor",{width:7,height:.18,depth:6},scene);baseFloor.position.set(8,-.09,-55);baseFloor.material=mat("safehouseConcrete","#777a76");baseFloor.checkCollisions=true;
  const baseRoof=BABYLON.MeshBuilder.CreateBox("safehouseRoof",{width:7.3,height:.22,depth:6.3},scene);baseRoof.position.set(8,3.15,-55);baseRoof.material=mat("safehouseRoofMat","#45515a");
  for(const x of [4.7,11.3])for(const z of [-57.8,-52.2]){const post=BABYLON.MeshBuilder.CreateBox("safehouseSupport",{width:.18,height:3.1,depth:.18},scene);post.position.set(x,1.55,z);post.material=mat("safehouseMetal","#46565d");}
  const baseBack=BABYLON.MeshBuilder.CreateBox("safehouseBackWall",{width:7,height:3,depth:.18},scene);baseBack.position.set(8,1.5,-58);baseBack.material=mat("safehouseWall","#9a9b8c");baseBack.checkCollisions=true;
  const baseSign=BABYLON.MeshBuilder.CreateBox("safehouseSign",{width:2.8,height:.48,depth:.12},scene);baseSign.position.set(8,2.55,-57.86);baseSign.material=mat("safehouseSignMat","#2b7465");
  const storageChest=BABYLON.MeshBuilder.CreateBox("safehouseStorage",{width:1.25,height:.85,depth:.85},scene);storageChest.position.set(8, .52,-56.9);storageChest.material=mat("safehouseChest","#806044");
  const storageLid=BABYLON.MeshBuilder.CreateBox("safehouseStorageLid",{width:1.3,height:.16,depth:.9},scene);storageLid.position.set(8,1.02,-56.9);storageLid.material=mat("safehouseChestLid","#bd9959");
  const relayStations=[[-45,-18],[0,18],[45,18]].map((position,index)=>{
    const root=new BABYLON.TransformNode("emergencyRelay"+index,scene);root.position.set(position[0],0,position[1]);
    const base=BABYLON.MeshBuilder.CreateCylinder("relayBase",{diameter:1.15,height:.28,tessellation:12},scene);base.parent=root;base.position.y=.14;base.material=mat("relayBaseMat"+index,"#515b62");
    const pole=BABYLON.MeshBuilder.CreateCylinder("relayPole",{diameter:.16,height:2.3,tessellation:10},scene);pole.parent=root;pole.position.y=1.35;pole.material=mat("relayPoleMat"+index,"#87959a");
    const panel=BABYLON.MeshBuilder.CreateBox("relayPanel",{width:.8,height:.65,depth:.2},scene);panel.parent=root;panel.position.set(0,1.95,0);panel.material=mat("relayPanelMat"+index,"#276e67");
    const antenna=BABYLON.MeshBuilder.CreateCylinder("relayAntenna",{diameter:.045,height:.8,tessellation:8},scene);antenna.parent=root;antenna.position.set(0,2.65,0);antenna.material=mat("relayAntennaMat"+index,"#d5d8d2");
    const marker=BABYLON.MeshBuilder.CreateCylinder("relayMarker",{diameter:1.5,height:.045,tessellation:20},scene);marker.parent=root;marker.position.y=.04;marker.material=mat("relayMarkerMat"+index,"#e7c83d");
    return {root,index,active:false};
  });

  // A stranded shopkeeper survivor introduces the first rescue objective.
  const survivorRoot=new BABYLON.TransformNode("survivorShopkeeper",scene);
  survivorRoot.position.set(4.9,0,-14.2);
  const survivorSkin=mat("survivorSkin","#b98261"),survivorCloth=mat("survivorCloth","#b9a36a"),survivorDark=mat("survivorDark","#302a25");
  const survivorPart=(name,mesh,material,pos)=>{mesh.name=name;mesh.parent=survivorRoot;mesh.material=material;mesh.position.copyFrom(pos);return mesh;};
  survivorPart("survivorBody",BABYLON.MeshBuilder.CreateCapsule("survivorBody",{height:.9,radius:.25},scene),survivorCloth,new BABYLON.Vector3(0,.88,0));
  survivorPart("survivorHead",BABYLON.MeshBuilder.CreateSphere("survivorHead",{diameter:.38,segments:14},scene),survivorSkin,new BABYLON.Vector3(0,1.52,0));
  survivorPart("survivorHair",BABYLON.MeshBuilder.CreateSphere("survivorHair",{diameter:.39,segments:12},scene),survivorDark,new BABYLON.Vector3(0,1.67,-.035)).scaling.y=.48;
  const survivorRig={arms:[],legs:[]};
  for(const side of [-1,1]){
    const arm=survivorPart("survivorArm",BABYLON.MeshBuilder.CreateCylinder("survivorArm",{height:.58,diameter:.13,tessellation:10},scene),survivorCloth,new BABYLON.Vector3(side*.31,.91,0));
    arm.rotation.z=side*-.12;survivorRig.arms.push(arm);
    const leg=survivorPart("survivorLeg",BABYLON.MeshBuilder.CreateCylinder("survivorLeg",{height:.55,diameter:.15,tessellation:10},scene),pantsMat,new BABYLON.Vector3(side*.13,.28,0));
    survivorRig.legs.push(leg);
  }
  const survivorMarker=BABYLON.MeshBuilder.CreateCylinder("survivorMarker",{diameter:.9,height:.035,tessellation:24},scene);
  survivorMarker.position.set(4.9,.06,-14.2);survivorMarker.material=safeMat;
  // Street-level dressing: utility poles, overhead cables, lamps and roadside market kiosks.
  const cityMetal=mat("cityUtilityMetal","#3d474b"),cableMat=mat("cityCable","#252c30"),lampMat=mat("streetLampGlass","#f6d98a"),stallPaint=mat("marketStallPaint","#a64e36"),stallCanvas=mat("marketStallCanvas","#e0c36b"),stallWood=mat("marketStallWood","#654b35");
  const utilityPoles=[];
  for(const x of [-22,22]){
    for(const z of [-48,-24,0,24,48]){
      const pole=BABYLON.MeshBuilder.CreateCylinder("cityUtilityPole",{height:7.8,diameter:.22,tessellation:8},scene);
      pole.position.set(x,3.9,z);pole.material=cityMetal;utilityPoles.push(pole);
      const crossbar=BABYLON.MeshBuilder.CreateBox("utilityCrossbar",{width:2.15,height:.13,depth:.16},scene);
      crossbar.position.set(x,7.15,z);crossbar.material=cityMetal;
      for(const side of [-1,0,1]){
        const insulator=BABYLON.MeshBuilder.CreateCylinder("utilityInsulator",{height:.34,diameter:.09,tessellation:8},scene);
        insulator.position.set(x+side*.78,7.36,z);insulator.material=lampMat;
      }
    }
  }
  const cableBetween=(name,a,b)=>{
    const delta=b.subtract(a),length=delta.length();
    const cable=BABYLON.MeshBuilder.CreateCylinder(name,{height:length,diameter:.035,tessellation:6},scene);
    cable.position.copyFrom(a.add(b).scale(.5));cable.rotationQuaternion=BABYLON.Quaternion.FromUnitVectorsToRef?BABYLON.Quaternion.FromUnitVectorsToRef(new BABYLON.Vector3(0,1,0),delta.normalize(),BABYLON.Quaternion.Identity()):null;
    if(!cable.rotationQuaternion){const direction=delta.normalize();cable.rotation.x=Math.atan2(direction.z,direction.y);cable.rotation.z=-Math.atan2(direction.x,Math.sqrt(direction.y*direction.y+direction.z*direction.z));}
    cable.material=cableMat;
    return cable;
  };
  for(const x of [-22,22]){
    for(let i=0;i<4;i++)cableBetween("overheadPowerCable",new BABYLON.Vector3(x,7.1,-48+i*24),new BABYLON.Vector3(x,7.1,-24+i*24));
  }
  // Warm street lamps make the neighbourhood readable after sunset.
  for(const side of [-1,1]){
    for(const z of [-42,-22,-2,18,38]){
      const x=side*9.1;
      const pole=BABYLON.MeshBuilder.CreateCylinder("streetLampPole",{height:5.2,diameter:.13,tessellation:10},scene);
      pole.position.set(x,2.6,z);pole.material=cityMetal;
      const arm=BABYLON.MeshBuilder.CreateCylinder("streetLampArm",{height:1.15,diameter:.09,tessellation:8},scene);
      arm.position.set(x-side*.48,5.05,z);arm.rotation.z=side*.45;arm.material=cityMetal;
      const head=BABYLON.MeshBuilder.CreateBox("streetLampHead",{width:.52,height:.16,depth:.34},scene);
      head.position.set(x-side*.92,4.98,z);head.material=lampMat;
      const glow=BABYLON.MeshBuilder.CreateSphere("streetLampGlow",{diameter:.18,segments:8},scene);
      glow.position.set(x-side*.92,4.86,z);glow.material=lampMat;
    }
  }
  // Small roadside stalls and handcarts establish a recognisable Pakistani market street.
  for(const side of [-1,1]){
    for(const z of [-34,-10,14,38]){
      const x=side*18.3;
      const counter=BABYLON.MeshBuilder.CreateBox("marketCartCounter",{width:2.5,height:.92,depth:1.25},scene);
      counter.position.set(x,.52,z);counter.material=stallWood;
      const canopy=BABYLON.MeshBuilder.CreateBox("marketCartCanopy",{width:2.9,height:.14,depth:1.65},scene);
      canopy.position.set(x,2.12,z);canopy.material=stallCanvas;
      for(const dx of [-1.12,1.12])for(const dz of [-.55,.55]){
        const post=BABYLON.MeshBuilder.CreateCylinder("marketCartPost",{height:1.3,diameter:.075,tessellation:8},scene);
        post.position.set(x+dx,1.42,z+dz);post.material=stallPaint;
      }
      const front=BABYLON.MeshBuilder.CreateBox("marketCartFront",{width:2.48,height:.18,depth:.06},scene);
      front.position.set(x,.88,z-.66);front.material=stallPaint;
      for(let item=0;item<4;item++){
        const produce=BABYLON.MeshBuilder.CreateSphere("marketProduce",{diameter:.23,segments:8},scene);
        produce.position.set(x-.78+item*.52,1.08,z-.2);produce.material=item%2?stallCanvas:safeMat;
      }
    }
  }
  // Roadside direction boards provide landmarks and a stronger local identity.
  for(const [x,z,labelColor] of [[-8.9,-48,"#276b57"],[8.9,42,"#9a4936"],[-8.9,28,"#315e83"]]){
    const board=BABYLON.MeshBuilder.CreateBox("pakistanStreetSign",{width:2.2,height:.72,depth:.12},scene);
    board.position.set(x,3.15,z);board.material=mat("streetSignMat"+x+z,labelColor);
    const post=BABYLON.MeshBuilder.CreateCylinder("streetSignPost",{height:3.2,diameter:.09,tessellation:8},scene);
    post.position.set(x,1.6,z);post.material=cityMetal;
  }
  // Keep the full expanded neighbourhood grid inside the world instead of trapping the player on the original starter street.
  for(const x of [-64,64]){const wall=BABYLON.MeshBuilder.CreateBox("cityBoundary",{width:.6,height:5,depth:130},scene);wall.position.set(x,2.5,0);wall.checkCollisions=true;wall.visibility=0.001;}
  for(const z of [-64,64]){const wall=BABYLON.MeshBuilder.CreateBox("cityEndBoundary",{width:130,height:5,depth:.6},scene);wall.position.set(0,2.5,z);wall.checkCollisions=true;wall.visibility=0.001;}
  const player=BABYLON.MeshBuilder.CreateCapsule("playerCollider",{height:1.9,radius:.42},scene);player.material=heroMat;player.visibility=0.001;player.position.set(0,.95,35);player.checkCollisions=true;player.ellipsoid=new BABYLON.Vector3(.42,.95,.42);camera.lockedTarget=player;
  const shieldMaterial=new BABYLON.StandardMaterial("heroShieldMaterial",scene);shieldMaterial.diffuseColor=new BABYLON.Color3(.12,.72,.92);shieldMaterial.emissiveColor=new BABYLON.Color3(.05,.42,.68);shieldMaterial.alpha=.16;shieldMaterial.wireframe=true;shieldMaterial.backFaceCulling=false;
  const heroShield=BABYLON.MeshBuilder.CreateSphere("heroEnergyShield",{diameter:2.75,segments:20},scene);heroShield.parent=player;heroShield.position.y=.04;heroShield.scaling.y=1.12;heroShield.material=shieldMaterial;heroShield.isPickable=false;heroShield.setEnabled(false);
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

  // Extra layered field gear and articulated lower limbs for Ibrahim.
  const collar=part("hero-jacket-collar",BABYLON.MeshBuilder.CreateBox("heroCollar",{width:.42,height:.13,depth:.39},scene),pantsMat);collar.position.set(0,.535,.015);
  const leftLap=part("hero-left-lapel",BABYLON.MeshBuilder.CreateBox("heroLapelL",{width:.12,height:.36,depth:.045},scene),pantsMat);leftLap.position.set(-.105,.34,.19);leftLap.rotation.z=-.22;
  const rightLap=part("hero-right-lapel",BABYLON.MeshBuilder.CreateBox("heroLapelR",{width:.12,height:.36,depth:.045},scene),pantsMat);rightLap.position.set(.105,.34,.19);rightLap.rotation.z=.22;
  const lowerArms=[],lowerLegs=[];
  for(const [side,arm,leg] of [[-1,leftArm,leftLeg],[1,rightArm,rightLeg]]){
    const pocket=part("hero-cargo-pocket",BABYLON.MeshBuilder.CreateBox("heroCargoPocket",{width:.2,height:.2,depth:.07},scene),packMat);pocket.position.set(side*.205,-.12,.19);
    const flap=part("hero-pocket-flap",BABYLON.MeshBuilder.CreateBox("heroPocketFlap",{width:.21,height:.055,depth:.08},scene),pantsMat);flap.position.set(side*.205,-.025,.2);
    const knee=part("hero-knee-guard",BABYLON.MeshBuilder.CreateBox("heroKneeGuard",{width:.25,height:.17,depth:.12},scene),bootMat);knee.parent=leg;knee.position.set(0,-.42,.105);
    const elbow=new BABYLON.TransformNode("heroElbow"+side,scene);elbow.parent=arm;elbow.position.set(0,-.57,0);
    const forearm=part("hero-forearm",BABYLON.MeshBuilder.CreateCylinder("heroForearm",{height:.38,diameterTop:.19,diameterBottom:.145,tessellation:12},scene),heroMat,elbow);forearm.position.y=-.19;
    const cuff=part("hero-glove-cuff",BABYLON.MeshBuilder.CreateCylinder("heroGloveCuff",{height:.12,diameter:.25,tessellation:10},scene),bootMat,elbow);cuff.position.y=-.37;
    const glove=part("hero-glove",BABYLON.MeshBuilder.CreateSphere("heroGlove",{diameter:.19,segments:12},scene),bootMat,elbow);glove.scaling.set(.82,1.12,.9);glove.position.set(0,-.46,.025);
    lowerArms.push(elbow);
    const kneeJoint=new BABYLON.TransformNode("heroKnee"+side,scene);kneeJoint.parent=leg;kneeJoint.position.set(0,-.62,0);
    const shin=part("hero-shin",BABYLON.MeshBuilder.CreateCylinder("heroShin",{height:.34,diameterTop:.23,diameterBottom:.18,tessellation:12},scene),pantsMat,kneeJoint);shin.position.y=-.17;
    lowerLegs.push(kneeJoint);
  }
  leftBoot.parent=lowerLegs[0];leftBoot.position.set(0,-.31,.07);
  rightBoot.parent=lowerLegs[1];rightBoot.position.set(0,-.31,.07);

  const heroRig={leftArm,rightArm,leftLeg,rightLeg,lowerArms,lowerLegs,heroParts};
  // Production-ready skinned humanoid base for Ibrahim (Quaternius CC0 asset).
  let heroModelReady=false,heroSkeleton=null,heroModelRoot=null,heroModelError=null;
  const heroBoneNodes=new Map(),heroBoneRest=new Map(),heroBoneParents=new Map();
  function setIbrahimBone(name,pitch=0,yaw=0,roll=0){
    const bone=heroBoneNodes.get(name),rest=heroBoneRest.get(name);
    if(!bone||!rest)return;
    const delta=BABYLON.Quaternion.RotationYawPitchRoll(yaw,pitch,roll);
    const rotation=rest.multiply(delta);
    heroPoseValues[name]=[pitch,yaw,roll];
    if(typeof bone.setRotationQuaternion==="function")bone.setRotationQuaternion(rotation,BABYLON.Space.LOCAL);
    else if(bone.rotationQuaternion)bone.rotationQuaternion=rotation;
    else if(bone.rotation)bone.rotation.copyFrom(rotation.toEulerAngles());
  }
  async function loadIbrahimModel(){
    try{
      const loaded=await BABYLON.SceneLoader.ImportMeshAsync(null,"/assets/hero/","ibrahim.glb",scene);
      heroModelRoot=new BABYLON.TransformNode("ibrahimSkinnedVisual",scene);
      heroModelRoot.parent=player;heroModelRoot.position.set(0,-.95,0);heroModelRoot.scaling.setAll(1);
      const rootMesh=loaded.meshes.find(m=>m.name==="__root__");
      if(rootMesh)rootMesh.parent=heroModelRoot;
      else{
        for(const node of [...(loaded.transformNodes||[]),...(loaded.meshes||[])])
          if(!node.parent)node.parent=heroModelRoot;
      }
      heroSkeleton=loaded.skeletons[0]||null;
      if(!heroSkeleton)throw new Error("Ibrahim GLB did not contain a humanoid skeleton");
      for(const bone of heroSkeleton.bones){
        const key=bone.name.toLowerCase();
        const node=bone.getTransformNode?.()||(loaded.transformNodes||[]).find(n=>n.name.toLowerCase()===key);
        if(node)heroBoneParents.set(key,node);
        const rest=bone.getRotationQuaternion?.(BABYLON.Space.LOCAL);
        if(rest){heroBoneNodes.set(key,bone);heroBoneRest.set(key,rest.clone());}
        else if(node){
          heroBoneNodes.set(key,node);
          heroBoneRest.set(key,node.rotationQuaternion?.clone()||BABYLON.Quaternion.RotationYawPitchRoll(node.rotation.y,node.rotation.x,node.rotation.z));
        }
      }
      const bodyMesh=loaded.meshes.find(m=>/superhero_male|retopology/i.test(m.name));
      if(bodyMesh){
        const positions=bodyMesh.getVerticesData("position");
        if(positions){
          const colors=[],skin=[.49,.30,.20,1],shirt=[.24,.30,.20,1],vest=[.16,.20,.15,1],trousers=[.20,.22,.23,1],boots=[.09,.075,.06,1];
          for(let i=0;i<positions.length;i+=3){
            const x=positions[i],y=positions[i+1];let c;
            if(y>1.54)c=skin;
            else if(y>1.18)c=Math.abs(x)>.28?shirt:vest;
            else if(y>.88)c=Math.abs(x)>.52?skin:vest;
            else if(y>.22)c=trousers;
            else c=boots;
            colors.push(c[0],c[1],c[2],c[3]);
          }
          bodyMesh.setVerticesData("color",colors,false,4);
          const uniform=new BABYLON.StandardMaterial("ibrahimFieldUniform",scene);
          uniform.diffuseColor=BABYLON.Color3.White();uniform.specularColor=new BABYLON.Color3(.12,.12,.12);uniform.useVertexColor=true;
          bodyMesh.material=uniform;
        }
      }
      for(const mesh of loaded.meshes){
        mesh.isPickable=false;mesh.receiveShadows=true;mesh.alwaysSelectAsActiveMesh=false;
        const n=mesh.name.toLowerCase();
        if(n.includes("eyes")||n.includes("eyebrows")){
          const detail=new BABYLON.StandardMaterial("ibrahimFaceDetail_"+mesh.name,scene);
          detail.diffuseColor=n.includes("eye")?new BABYLON.Color3(.055,.045,.04):new BABYLON.Color3(.12,.075,.045);
          detail.specularColor=new BABYLON.Color3(.08,.08,.08);mesh.material=detail;
        }
      }
      // Small survival pack and radio are attached to the actual torso bones.
      const spine=heroBoneParents.get("spine_02")||heroBoneParents.get("spine_01");
      if(spine){
        const packMat=new BABYLON.StandardMaterial("ibrahimPackMaterial",scene);packMat.diffuseColor=new BABYLON.Color3(.20,.19,.14);
        const packMesh=BABYLON.MeshBuilder.CreateBox("ibrahimFieldPack",{width:.34,height:.43,depth:.17},scene);
        packMesh.parent=spine;packMesh.position.set(0,-.015,-.145);packMesh.material=packMat;packMesh.isPickable=false;
        const strapMat=new BABYLON.StandardMaterial("ibrahimPackStraps",scene);strapMat.diffuseColor=new BABYLON.Color3(.10,.11,.09);
        for(const side of [-1,1]){
          const strap=BABYLON.MeshBuilder.CreateBox("ibrahimPackStrap",{width:.055,height:.38,depth:.035},scene);
          strap.parent=spine;strap.position.set(side*.135,.015,.095);strap.rotation.z=side*-.16;strap.material=strapMat;strap.isPickable=false;
        }
      }
      heroParts.forEach(mesh=>mesh.setEnabled(false));
      heroModelReady=true;
      console.info("Ibrahim skinned character loaded:",heroSkeleton.bones.length,"bones");
    }catch(error){heroModelError=String(error?.message||error);console.warn("Ibrahim character asset unavailable; keeping fallback model.",error);}
  }
  loadIbrahimModel();


  const radio=part("hero-radio",BABYLON.MeshBuilder.CreateBox("heroRadio",{width:.12,height:.18,depth:.08},scene),bootMat);radio.position.set(-.25,.34,-.02);
  const radioAntenna=part("hero-radio-antenna",BABYLON.MeshBuilder.CreateCylinder("heroRadioAntenna",{height:.16,diameter:.018,tessellation:6},scene),shirtMat);radioAntenna.position.set(-.27,.49,-.02);

  const safe=BABYLON.MeshBuilder.CreateCylinder("safeZone",{diameter:5,height:.12,tessellation:48},scene);safe.position.set(0,.12,-43);safe.material=safeMat;
  // Original low-poly walker characters: layered torso, head, face, articulated arms and legs.
  function createWalker(i){
    const root=BABYLON.MeshBuilder.CreateCapsule("walkerCollider"+i,{height:1.85,radius:.4},scene);
    root.checkCollisions=true;
    root.material=zombieMat;root.visibility=.001;const spawnPoints=[[-4,-10],[4,-18],[-19,-27],[19,-30],[-39,-42],[39,-40],[-39,5],[39,12],[-20,42],[20,45],[-5,53],[6,-48]];const spawn=spawnPoints[i%spawnPoints.length];root.position.set(spawn[0],1,spawn[1]);
    const archetypes=[
      {name:"WANDERER",speed:1.35,detect:25,scale:1,cloth:"#53634d"},
      {name:"SPRINTER",speed:2.55,detect:31,scale:.92,cloth:"#6b5946"},
      {name:"GUARDIAN",speed:.92,detect:22,scale:1.22,cloth:"#394d5a"},
      {name:"SCOUT",speed:1.8,detect:34,scale:.88,cloth:"#625c43"},
      {name:"ALPHA",speed:1.15,detect:30,scale:1.38,cloth:"#51465d"}
    ];
    const archetype=archetypes[i%archetypes.length];
    root.scaling.setAll(archetype.scale);root.metadata={archetype:archetype.name,speed:archetype.speed,detectionRange:archetype.detect,wanderTimer:Math.random()*2,wanderAngle:Math.random()*Math.PI*2,phase:i*.83,knockback:null};
    const variantCloth=mat("walkerCloth"+i,archetype.cloth);
    const piece=(name,mesh,material,parent=root)=>{mesh.name=name;mesh.material=material;mesh.parent=parent;return mesh;};
    const torso=piece("walkerTorso",BABYLON.MeshBuilder.CreateBox("walkerTorso",{width:.58,height:.76,depth:.32},scene),variantCloth);torso.position.y=.08;
    const chest=piece("walkerChest",BABYLON.MeshBuilder.CreateBox("walkerChest",{width:.38,height:.34,depth:.035},scene),zombieMat);chest.position.set(0,.13,.17);
    const head=piece("walkerHead",BABYLON.MeshBuilder.CreateSphere("walkerHead",{diameter:.4,segments:12},scene),zombieSkin);head.position.y=.7;
    const hair=piece("walkerHair",BABYLON.MeshBuilder.CreateSphere("walkerHair",{diameter:.41,segments:10},scene),zombieDark);hair.position.set(0,.83,-.015);hair.scaling.y=.45;
    const glowEye=mat("walkerGlowEye"+i,"#e5a34c");glowEye.emissiveColor=new BABYLON.Color3(.55,.18,.025);
    for(const side of [-1,1]){
      const eyeSocket=piece("walkerEyeSocket",BABYLON.MeshBuilder.CreateSphere("walkerEyeSocket",{diameter:.095,segments:8},scene),zombieDark);eyeSocket.position.set(side*.085,.72,.168);
      const eye=piece("walkerEye",BABYLON.MeshBuilder.CreateSphere("walkerEye",{diameter:.052,segments:8},scene),glowEye);eye.position.set(side*.085,.72,.205);
      const brow=piece("walkerBrow",BABYLON.MeshBuilder.CreateBox("walkerBrow",{width:.12,height:.035,depth:.035},scene),zombieDark);brow.position.set(side*.085,.79,.18);
    }
    const nose=piece("walkerNose",BABYLON.MeshBuilder.CreateSphere("walkerNose",{diameter:.075,segments:8},scene),zombieSkin);nose.position.set(0,.665,.205);nose.scaling.z=1.3;
    const mouth=piece("walkerMouth",BABYLON.MeshBuilder.CreateBox("walkerMouth",{width:.19,height:.055,depth:.025},scene),zombieDark);mouth.position.set(0,.61,.19);
    for(const side of [-1,1]){
      const tooth=piece("walkerTooth",BABYLON.MeshBuilder.CreateBox("walkerTooth",{width:.035,height:.025,depth:.018},scene),shirtMat);tooth.position.set(side*.045,.615,.208);
    }
    const tornPanel=piece("walkerTornCloth",BABYLON.MeshBuilder.CreateBox("walkerTornCloth",{width:.17,height:.25,depth:.045},scene),zombieDark);tornPanel.position.set(.17,-.04,.19);tornPanel.rotation.z=-.2;
    const shoulderPatch=piece("walkerShoulderPatch",BABYLON.MeshBuilder.CreateBox("walkerShoulderPatch",{width:.2,height:.18,depth:.36},scene),variantCloth);shoulderPatch.position.set(-.31,.35,0);
    // Layered survivor clothing breaks up the old toy-like box silhouette.
    const neck=piece("walkerNeck",BABYLON.MeshBuilder.CreateCylinder("walkerNeckMesh",{height:.2,diameter:.17,tessellation:10},scene),zombieSkin);neck.position.set(0,.49,0);
    const collar=piece("walkerCollar",BABYLON.MeshBuilder.CreateBox("walkerCollarMesh",{width:.48,height:.12,depth:.37},scene),zombieDark);collar.position.set(0,.43,.015);
    const belt=piece("walkerBelt",BABYLON.MeshBuilder.CreateBox("walkerBeltMesh",{width:.59,height:.105,depth:.34},scene),bootMat);belt.position.set(0,-.28,0);
    const buckle=piece("walkerBuckle",BABYLON.MeshBuilder.CreateBox("walkerBuckleMesh",{width:.105,height:.085,depth:.035},scene),supplyMat);buckle.position.set(0,-.28,.185);
    for(const side of [-1,1]){
      const shoulder=piece("walkerShoulder",BABYLON.MeshBuilder.CreateSphere("walkerShoulderMesh",{diameter:.29,segments:10},scene),variantCloth);shoulder.position.set(side*.30,.34,0);shoulder.scaling.set(1,.86,1);
      const sleeve=piece("walkerSleeve",BABYLON.MeshBuilder.CreateCylinder("walkerSleeveMesh",{height:.27,diameter:.22,tessellation:10},scene),variantCloth);sleeve.position.set(side*.35,.19,0);sleeve.rotation.z=side*.12;
      const cuff=piece("walkerCuff",BABYLON.MeshBuilder.CreateCylinder("walkerCuffMesh",{height:.09,diameter:.205,tessellation:10},scene),zombieDark);cuff.position.set(side*.35,.035,0);
      const trouserPatch=piece("walkerKneePatch",BABYLON.MeshBuilder.CreateBox("walkerKneePatchMesh",{width:.23,height:.20,depth:.055},scene),variantCloth);trouserPatch.position.set(side*.15,-.57,.13);
      trouserPatch.rotation.z=side*.08;
      const rag=piece("walkerClothRag",BABYLON.MeshBuilder.CreateBox("walkerClothRagMesh",{width:.12,height:.28,depth:.035},scene),zombieDark);rag.position.set(side*.23,-.19,.19);rag.rotation.z=side*.28;
    }
    const limb=(name,x,y,length,material)=>{
      const pivot=new BABYLON.TransformNode(name+"Pivot",scene);pivot.parent=root;pivot.position.set(x,y,0);
      const mesh=piece(name,BABYLON.MeshBuilder.CreateCylinder(name+"Mesh",{height:length,diameter:name.includes("arm")?.19:.23,tessellation:10},scene),material,pivot);mesh.position.y=-length/2;
      return pivot;
    };
    const leftArm=limb("walkerLeftArm",-.35,.37,.65,zombieSkin),rightArm=limb("walkerRightArm",.35,.37,.65,zombieSkin);
    const leftLeg=limb("walkerLeftLeg",-.15,-.29,.7,zombieDark),rightLeg=limb("walkerRightLeg",.15,-.29,.7,zombieDark);
    const lowerArms=[],lowerLegs=[];
    for(const [side,arm,leg] of [[-1,leftArm,leftLeg],[1,rightArm,rightLeg]]){
      const elbow=new BABYLON.TransformNode("walkerElbowPivot"+i+"_"+side,scene);elbow.parent=arm;elbow.position.y=-.34;
      const forearm=piece("walkerForearm",BABYLON.MeshBuilder.CreateCylinder("walkerForearmMesh",{height:.34,diameter:.17,tessellation:10},scene),zombieSkin,elbow);forearm.position.y=-.17;forearm.rotation.z=side*-.08;
      const hand=piece("walkerHand",BABYLON.MeshBuilder.CreateSphere("walkerHandMesh",{diameter:.19,segments:10},scene),zombieSkin,elbow);hand.position.set(0,-.34,.015);hand.scaling.set(.85,1.15,.72);
      lowerArms.push(elbow);
      const kneePivot=new BABYLON.TransformNode("walkerKneePivot"+i+"_"+side,scene);kneePivot.parent=leg;kneePivot.position.y=-.35;
      const knee=piece("walkerKnee",BABYLON.MeshBuilder.CreateSphere("walkerKneeMesh",{diameter:.25,segments:10},scene),zombieDark,kneePivot);knee.position.set(0,0,.025);knee.scaling.set(1,.8,.9);
      const shin=piece("walkerShin",BABYLON.MeshBuilder.CreateCylinder("walkerShinMesh",{height:.36,diameterTop:.20,diameterBottom:.16,tessellation:10},scene),zombieDark,kneePivot);shin.position.y=-.18;
      const boot=piece("walkerBoot",BABYLON.MeshBuilder.CreateBox("walkerBoot",{width:.22,height:.15,depth:.3},scene),zombieDark,kneePivot);boot.position.set(0,-.53,.10);
      lowerLegs.push(kneePivot);
    }
    root.rig={leftArm,rightArm,leftLeg,rightLeg,lowerArms,lowerLegs,torso,head,phase:i*.83};
    return root;
  }
  const zombies=Array.from({length:12},(_,i)=>createWalker(i));
  // Super Water Gun: playful, non-damaging cartoon splash knockback.
  const waterShotMaterial=new BABYLON.StandardMaterial("superWaterShotMaterial",scene);
  waterShotMaterial.diffuseColor=new BABYLON.Color3(.12,.72,1);
  waterShotMaterial.emissiveColor=new BABYLON.Color3(.04,.32,.62);
  waterShotMaterial.alpha=.94;
  const waterShots=[];
  let waterGunCooldown=0;
  function applyWaterKnockback(z,direction){
    const horizontal=new BABYLON.Vector3(direction.x,0,direction.z);
    if(horizontal.lengthSquared()<.001)horizontal.set(0,0,-1);
    horizontal.normalize();
    z.metadata.knockback={velocity:horizontal.scale(12.5),elapsed:0,flightDuration:.95,recovery:.72,baseYaw:z.rotation.y,spin:(Math.random()>.5?1:-1)*8.5};
    playCue("water");
    document.getElementById("status").textContent="SUPER WATER GUN! Zombie splashed far away.";
  }
  function fireWaterGun(){
    if(state.paused||state.ended||driving||state.health<=0||waterGunCooldown>0)return;
    const forward=new BABYLON.Vector3(Math.sin(state.yaw),0,-Math.cos(state.yaw));
    const origin=player.position.add(new BABYLON.Vector3(0,.55,0)).add(forward.scale(.62));
    let target=null,targetDistance=Infinity;
    for(const z of zombies){
      if(z.metadata.knockback)continue;
      const offset=z.position.subtract(origin);offset.y=0;
      const distance=offset.length();if(distance>28||distance<.5)continue;
      const facing=BABYLON.Vector3.Dot(offset.normalize(),forward);
      if(facing>.48&&distance<targetDistance){target=z;targetDistance=distance;}
    }
    const direction=target?target.position.subtract(origin).normalize():forward;
    const mesh=BABYLON.MeshBuilder.CreateSphere("superWaterProjectile",{diameter:.28,segments:12},scene);
    mesh.position.copyFrom(origin);mesh.material=waterShotMaterial;mesh.isPickable=false;
    waterShots.push({mesh,direction,target,distance:0,maxDistance:target?targetDistance+1.2:28});
    waterGunCooldown=.72;waterGunButton.disabled=true;waterGunButton.textContent="SPLASH!";
  }
  // Collectible supply crates create a short, repeatable survival objective before the safe zone.
  const pickups=[];
  for(let i=0;i<4;i++){
    const crate=BABYLON.MeshBuilder.CreateBox("supplyCrate"+i,{width:.72,height:.62,depth:.62},scene);crate.material=supplyMat;crate.position.set(i%2===0?-2.1:2.1,.42,24-i*15);
    const band=BABYLON.MeshBuilder.CreateBox("supplyBand"+i,{width:.76,height:.09,depth:.12},scene);band.material=bootMat;band.parent=crate;band.position.y=.05;
    const marker=BABYLON.MeshBuilder.CreateCylinder("supplyMarker"+i,{diameter:1.05,height:.035,tessellation:24},scene);marker.material=safeMat;marker.position.set(crate.position.x,.04,crate.position.z);
    pickups.push({mesh:crate,marker,collected:false,phase:i});
  }
  // Pakistani street transport fleet: sedan, motorcycle, auto-rickshaw, minibus and 4K-style bus.
  function createVehicle(type,x,z,color){
    const isBike=type==="MOTORCYCLE",isRickshaw=type==="AUTO RICKSHAW",isChingchi=type==="CHINGCHI",isMini=type==="MINI BUS",isBus=type==="4K BUS";
    const width=isBike?.9:isRickshaw?1.45:isChingchi?1.8:isMini?2.2:isBus?2.55:1.9;
    const length=isBike?2.1:isRickshaw?2.35:isChingchi?2.9:isMini?4.2:isBus?7.2:3.5;
    const height=isBike?.65:isRickshaw?1.7:isChingchi?2.05:isMini?2.5:isBus?3.1:.85;
    const root=BABYLON.MeshBuilder.CreateBox(type+"Collider",{width,height,depth:length},scene);
    root.position.set(x,height/2,z);root.material=heroMat;root.visibility=.001;root.checkCollisions=true;
    const parts=[];
    const part=(mesh,material,pos)=>{mesh.parent=root;mesh.material=material;mesh.position.copyFrom(pos);parts.push(mesh);return mesh;};
    const paint=mat(type+"Paint",color),dark=mat(type+"Dark","#252c30");
    if(isBike){
      part(BABYLON.MeshBuilder.CreateBox("motorcycleFrame",{width:.34,height:.34,depth:1.2},scene),paint,new BABYLON.Vector3(0,-.02,0));
      part(BABYLON.MeshBuilder.CreateBox("motorcycleTank",{width:.55,height:.42,depth:.55},scene),paint,new BABYLON.Vector3(0,.3,.12));
      for(const zz of [-.78,.78]){const wheel=BABYLON.MeshBuilder.CreateCylinder("motorcycleWheel",{diameter:.66,height:.14,tessellation:16},scene);wheel.rotation.z=Math.PI/2;part(wheel,dark,new BABYLON.Vector3(0,-.08,zz));}
      part(BABYLON.MeshBuilder.CreateBox("motorcycleSeat",{width:.42,height:.13,depth:.62},scene),bootMat,new BABYLON.Vector3(0,.42,-.35));
      part(BABYLON.MeshBuilder.CreateCylinder("motorcycleHandle",{diameter:.06,height:1.05,tessellation:8},scene),dark,new BABYLON.Vector3(0,.58,.7));
    }else if(isChingchi){
      part(BABYLON.MeshBuilder.CreateBox("chingchiDeck",{width:1.65,height:.22,depth:1.75},scene),paint,new BABYLON.Vector3(0,-.02,-.22));
      part(BABYLON.MeshBuilder.CreateBox("chingchiPassengerCabin",{width:1.55,height:.95,depth:1.35},scene),paint,new BABYLON.Vector3(0,.48,-.48));
      part(BABYLON.MeshBuilder.CreateBox("chingchiPassengerWindow",{width:1.58,height:.56,depth:1.18},scene),windowMat,new BABYLON.Vector3(0,.68,-.48));
      part(BABYLON.MeshBuilder.CreateBox("chingchiRoof",{width:1.8,height:.12,depth:1.62},scene),dark,new BABYLON.Vector3(0,1.04,-.48));
      part(BABYLON.MeshBuilder.CreateBox("chingchiFrontNose",{width:.68,height:.65,depth:.48},scene),paint,new BABYLON.Vector3(0,.22,.9));
      part(BABYLON.MeshBuilder.CreateCylinder("chingchiHandle",{diameter:.055,height:1.05,tessellation:8},scene),dark,new BABYLON.Vector3(0,.78,1.13));
      const frontWheel=BABYLON.MeshBuilder.CreateCylinder("chingchiFrontWheel",{diameter:.65,height:.16,tessellation:16},scene);frontWheel.rotation.z=Math.PI/2;part(frontWheel,dark,new BABYLON.Vector3(0,-.18,1.12));
      for(const side of [-1,1]){const rear=BABYLON.MeshBuilder.CreateCylinder("chingchiRearWheel",{diameter:.72,height:.18,tessellation:16},scene);rear.rotation.z=Math.PI/2;part(rear,dark,new BABYLON.Vector3(side*.82,-.18,-.65));}
    }else{
      part(BABYLON.MeshBuilder.CreateBox(type+"Body",{width:width*.94,height:height*.48,depth:length*.94},scene),paint,new BABYLON.Vector3(0,-height*.08,0));
      const cabHeight=isRickshaw?height*.68:isMini?height*.4:isBus?height*.45:.68;
      const cabDepth=isRickshaw?length*.5:isMini?length*.72:isBus?length*.72:1.75;
      part(BABYLON.MeshBuilder.CreateBox(type+"Cabin",{width:width*.78,height:cabHeight,depth:cabDepth},scene),windowMat,new BABYLON.Vector3(0,height*.28,-length*.02));
      if(isRickshaw){
        part(BABYLON.MeshBuilder.CreateBox("rickshawRoof",{width:width*.92,height:.12,depth:length*.55},scene),dark,new BABYLON.Vector3(0,height*.55,-.1));
        part(BABYLON.MeshBuilder.CreateBox("rickshawFront",{width:width*.7,height:.48,depth:.12},scene),paint,new BABYLON.Vector3(0,-.02,length*.43));
      }
      if(isMini||isBus)part(BABYLON.MeshBuilder.CreateBox("busRoof",{width:width*.82,height:.13,depth:length*.82},scene),dark,new BABYLON.Vector3(0,height*.54,-length*.02));
      const wheelZ=isBike?.7:length*.34;
      for(const side of [-1,1])for(const zz of (isRickshaw?[length*.31,-length*.31]:[wheelZ,-wheelZ])){
        const wheel=BABYLON.MeshBuilder.CreateCylinder(type+"Wheel",{diameter:isBus?.9:isMini?.72:.62,height:.2,tessellation:14},scene);wheel.rotation.z=Math.PI/2;
        part(wheel,dark,new BABYLON.Vector3(side*(width*.48),-height*.35,zz));
      }
      if(!isRickshaw&&!isMini&&!isBus){
        part(BABYLON.MeshBuilder.CreateBox("sedanRoof",{width:1.52,height:.12,depth:1.82},scene),dark,new BABYLON.Vector3(0,.9,-.12));
      }
    }
    const headlightMaterial=mat(type+"HeadlightGlow","#f6e7a0");headlightMaterial.emissiveColor=new BABYLON.Color3(.8,.72,.42);
    const tailMaterial=mat(type+"TailLightGlow","#a92720");tailMaterial.emissiveColor=new BABYLON.Color3(.35,.025,.015);
    const frontLights=[],rearLights=[],headlightBeams=[];
    for(const side of [-1,1]){
      const front=BABYLON.MeshBuilder.CreateBox(type+"FrontLamp",{width:.22,height:.13,depth:.055},scene);front.parent=root;front.position.set(side*width*.31,-height*.02,length*.49);front.material=headlightMaterial;frontLights.push(front);
      const rear=BABYLON.MeshBuilder.CreateBox(type+"RearLamp",{width:.2,height:.12,depth:.055},scene);rear.parent=root;rear.position.set(side*width*.31,-height*.02,-length*.49);rear.material=tailMaterial;rearLights.push(rear);
      const beam=new BABYLON.SpotLight(type+"HeadlightBeam"+side,BABYLON.Vector3.Zero(),new BABYLON.Vector3(0,-.08,1),.72,2.2,scene);
      beam.parent=root;beam.position.set(side*width*.31,-height*.02,length*.46);beam.range=isBus?42:isMini?32:25;beam.intensity=isBus?1.25:1;beam.setEnabled(false);headlightBeams.push(beam);
    }
    frontLights.forEach(mesh=>{mesh.isVisible=false;});rearLights.forEach(mesh=>{mesh.isVisible=false;});
    return {root,type,parts,fuel:100,condition:100,lastImpact:0,lightsOn:false,frontLights,rearLights,headlightBeams};
  }
  const fleet=[
    createVehicle("SEDAN",3.3,31,"#315f78"),
    createVehicle("MOTORCYCLE",-26, -24,"#b84436"),
    createVehicle("AUTO RICKSHAW",26,24,"#d4b72d"),
    createVehicle("MINI BUS",-26,27,"#3f8a75"),
    createVehicle("4K BUS",26,-28,"#3466a1"),
    createVehicle("CHINGCHI",-43,-5,"#c75b3c")
  ];
  const vehicle=fleet[0].root;
  let activeVehicle=fleet[0],driving=false;
  const hornButton=document.getElementById("vehicle-horn");
  const lightsButton=document.getElementById("vehicle-lights");
  const brakeButton=document.getElementById("vehicle-brake");
  const crouchButton=document.getElementById("crouch");
  const shieldButton=document.getElementById("shield");
  function activateShield(){
    if(driving||state.paused||state.ended||state.health<=0||worldClock<state.shieldCooldownUntil)return;
    state.shieldUntil=worldClock+4.5;state.shieldCooldownUntil=worldClock+20;
    heroShield.setEnabled(true);playCue("shield");
    document.getElementById("status").textContent="Energy shield active — move away from the infected!";
    showSubtitle("توانائی کی ڈھال فعال ہے!","Energy shield active — escape while protected!",2600);
  }
  shieldButton.addEventListener("click",activateShield);
  crouchButton.addEventListener("click",()=>{if(driving||state.paused||state.ended)return;state.crouching=!state.crouching;crouchButton.textContent=state.crouching?"STAND":"CROUCH";playCue("tap");});
  brakeButton.addEventListener("pointerdown",()=>{if(driving&&!state.paused&&!state.ended)state.braking=true;});
  ["pointerup","pointercancel","pointerleave"].forEach(eventName=>brakeButton.addEventListener(eventName,()=>{state.braking=false;}));
  function setVehicleLights(on){
    activeVehicle.lightsOn=!!on;
    activeVehicle.frontLights.forEach(mesh=>{mesh.isVisible=activeVehicle.lightsOn;});
    activeVehicle.headlightBeams.forEach(light=>light.setEnabled(activeVehicle.lightsOn));
    lightsButton.textContent=activeVehicle.lightsOn?"LIGHTS ON":"LIGHTS";
  }
  hornButton.addEventListener("click",()=>{if(!driving||state.paused||state.ended)return;playCue("horn");});
  lightsButton.addEventListener("click",()=>{if(!driving||state.paused||state.ended)return;setVehicleLights(!activeVehicle.lightsOn);playCue("tap");});
  const driveButton=document.getElementById("drive");
  const vehiclePrompt=document.getElementById("vehicle-prompt");
  const buildingPrompt=document.getElementById("building-prompt");
  const storageButton=document.getElementById("storage-button");
  const storagePanel=document.getElementById("storage-panel");
  const storageStatus=document.getElementById("storage-status");
  const rescueButton=document.getElementById("rescue");
  const serviceButton=document.getElementById("service-button");
  const waterGunButton=document.getElementById("water-gun");
  waterGunButton.addEventListener("click",fireWaterGun);
  const servicePanel=document.getElementById("service-panel");
  function nearestVehicle(){
    // Interaction range is measured on the ground plane; character/vehicle
    // collider heights must not reduce the usable touchscreen approach radius.
    let nearest=null,distance=Infinity;
    for(const item of fleet){
      const dx=player.position.x-item.root.position.x;
      const dz=player.position.z-item.root.position.z;
      const d=Math.hypot(dx,dz);
      if(d<distance){distance=d;nearest=item;}
    }
    return {item:nearest,distance};
  }
  function toggleVehicle(){
    if(state.paused||state.ended)return;
    if(!driving){
      const found=nearestVehicle();
      if(!found.item||found.distance>4.8)return;
      activeVehicle=found.item;driving=true;player.setEnabled(false);camera.lockedTarget=activeVehicle.root;setVehicleLights(activeVehicle.lightsOn);
      document.getElementById("status").textContent="Driving "+activeVehicle.type+" — use the joystick to steer and tap EXIT to leave.";
      driveButton.textContent="EXIT";
    }else{
      driving=false;document.getElementById("vehicle-status").hidden=true;player.position.copyFrom(activeVehicle.root.position);player.position.x+=activeVehicle.type==="MOTORCYCLE"?1.1:activeVehicle.type==="CHINGCHI"?1.9:1.6;player.position.y=.95;
      player.rotation.y=activeVehicle.root.rotation.y;player.setEnabled(true);camera.lockedTarget=player;hornButton.hidden=true;lightsButton.hidden=true;brakeButton.hidden=true;state.braking=false;
      document.getElementById("status").textContent="On foot — approach a parked vehicle and tap DRIVE.";
      driveButton.textContent="DRIVE";
    }
  }
  driveButton.addEventListener("click",toggleVehicle);
  const updateServicePanel=()=>{
    const selected=nearestVehicle().item||activeVehicle;
    document.getElementById("service-vehicle-name").textContent=selected.type;
    document.getElementById("service-fuel-value").textContent=Math.round(selected.fuel)+"%";
    document.getElementById("service-condition-value").textContent=Math.round(selected.condition)+"%";
    document.getElementById("refuel-vehicle").disabled=selected.fuel>=99;
    document.getElementById("repair-vehicle").disabled=selected.condition>=99||state.inventory.parts<1;
    servicePanel.dataset.vehicle=selected.type;
  };
  serviceButton.addEventListener("click",()=>{
    if(state.paused||state.ended||driving)return;
    updateServicePanel();state.serviceOpen=true;state.moveX=0;state.moveY=0;state.sprint=false;servicePanel.hidden=false;
  });
  document.getElementById("close-service").addEventListener("click",()=>{state.serviceOpen=false;servicePanel.hidden=true;});
  document.getElementById("refuel-vehicle").addEventListener("click",()=>{
    const selected=fleet.find(v=>v.type===servicePanel.dataset.vehicle)||activeVehicle;
    selected.fuel=100;updateServicePanel();saveProgress();
    document.getElementById("service-feedback").textContent="Fuel tank refilled. Ready to drive.";
  });
  document.getElementById("repair-vehicle").addEventListener("click",()=>{
    const selected=fleet.find(v=>v.type===servicePanel.dataset.vehicle)||activeVehicle;
    if(state.inventory.parts<1){document.getElementById("service-feedback").textContent="You need one spare part to repair this vehicle.";return;}
    state.inventory.parts--;selected.condition=100;updateInventory();updateServicePanel();saveProgress();
    document.getElementById("service-feedback").textContent="Vehicle repaired. One spare part used.";
  });
  rescueButton.addEventListener("click",()=>{
    if(state.paused||state.ended||driving)return;
    if(state.missionIndex===1){
      if(state.rescued||BABYLON.Vector3.Distance(player.position,survivorRoot.position)>2.7)return;
      state.rescued=true;survivorRoot.setEnabled(true);survivorMarker.setEnabled(false);
      playCue("rescue");document.getElementById("message").textContent="Shopkeeper rescued — stay close and escort him to the safe zone.";
      document.getElementById("status").textContent="The shopkeeper is following you. Collect all 4 supplies and bring him to extraction.";
      showSubtitle("براہ کرم مجھے یہاں سے نکالیں۔ شکریہ!","Thank you for rescuing me. Let's reach the safe zone.",4200);
      saveProgress();
    }else{
      const station=relayStations.filter(item=>!item.active).sort((a,b)=>BABYLON.Vector3.Distance(player.position,a.root.position)-BABYLON.Vector3.Distance(player.position,b.root.position))[0];
      if(!station||BABYLON.Vector3.Distance(player.position,station.root.position)>3.1)return;
      station.active=true;station.root.setEnabled(false);state.activatedRelays.push(station.index);
      const count=state.activatedRelays.length;
      playCue("success");document.getElementById("message").textContent="Emergency relay online: "+count+"/3";
      document.getElementById("status").textContent=count===3?"All radio relays active. Return to the safe zone.":"Activate the remaining "+(3-count)+" emergency radio relays.";
      showSubtitle("ریڈیو ٹاور فعال ہو گیا۔","Emergency radio relay activated.",2600);
      saveProgress();
    }
  });
  const SAVE_KEY="cvirus-zombies-save-v1";
  let savedGame=null;
  try{savedGame=JSON.parse(localStorage.getItem(SAVE_KEY)||"null");}catch{savedGame=null;}
  state.missionIndex=savedGame?.missionIndex===2?2:1;
  state.activatedRelays=Array.isArray(savedGame?.activatedRelays)?[...new Set(savedGame.activatedRelays.filter(n=>Number.isInteger(n)&&n>=0&&n<3))]:[];
  relayStations.forEach(item=>{item.active=state.activatedRelays.includes(item.index);item.root.setEnabled(state.missionIndex===2&&!item.active);});
  state.supplies=Number.isInteger(savedGame?.supplies)?Math.max(0,Math.min(4,savedGame.supplies)):0;
  state.inventory={water:0,food:0,medicine:0,parts:0,...(savedGame?.inventory||{})};
  state.stash={water:0,food:0,medicine:0,parts:0,...(savedGame?.stash||{})};
  for(const key of ["water","food","medicine","parts"])state.stash[key]=Number.isInteger(state.stash[key])?Math.max(0,Math.min(999,state.stash[key])):0;
  for(const key of ["water","food","medicine","parts"])state.inventory[key]=Number.isInteger(state.inventory[key])?Math.max(0,Math.min(99,state.inventory[key])):0;
  state.rescued=savedGame?.survivorRescued===true;
  state.safe=savedGame?.missionComplete===true&&(state.missionIndex===1?state.supplies===4&&state.rescued:state.activatedRelays.length===3);
  survivorRoot.setEnabled(state.rescued&&state.missionIndex===1);
  if(state.rescued)survivorMarker.setEnabled(false);
  state.health=Number.isFinite(savedGame?.health)?BABYLON.Scalar.Clamp(savedGame.health,1,100):100;
  state.stamina=Number.isFinite(savedGame?.stamina)?BABYLON.Scalar.Clamp(savedGame.stamina,0,100):100;
  state.thirst=Number.isFinite(savedGame?.thirst)?BABYLON.Scalar.Clamp(savedGame.thirst,0,100):100;
  state.hunger=Number.isFinite(savedGame?.hunger)?BABYLON.Scalar.Clamp(savedGame.hunger,0,100):100;
  document.getElementById("thirst").style.width=state.thirst+"%";
  document.getElementById("hunger").style.width=state.hunger+"%";
  document.getElementById("stamina").style.width=state.stamina+"%";
  if(Array.isArray(savedGame?.vehicle)&&savedGame.vehicle.length===3&&savedGame.vehicle.every(Number.isFinite))vehicle.position.set(savedGame.vehicle[0],.58,savedGame.vehicle[2]);
  if(Array.isArray(savedGame?.fleet))savedGame.fleet.forEach((entry,i)=>{if(i<fleet.length&&Array.isArray(entry)&&entry.length>=4&&entry.slice(0,4).every(Number.isFinite)){fleet[i].root.position.set(entry[0],fleet[i].root.position.y,entry[2]);fleet[i].root.rotation.y=entry[3];if(Number.isFinite(entry[4]))fleet[i].fuel=BABYLON.Scalar.Clamp(entry[4],0,100);if(Number.isFinite(entry[5]))fleet[i].condition=BABYLON.Scalar.Clamp(entry[5],0,100);if(entry[6]===0||entry[6]===1){fleet[i].lightsOn=entry[6]===1;fleet[i].frontLights.forEach(mesh=>{mesh.isVisible=fleet[i].lightsOn;});fleet[i].headlightBeams.forEach(light=>light.setEnabled(fleet[i].lightsOn));}}});
  if(Array.isArray(savedGame?.player)&&savedGame.player.length===3&&savedGame.player.every(Number.isFinite)){
    player.position.set(savedGame.player[0],.95,savedGame.player[2]);
    // A save made while driving stores the hero at the vehicle position.
    // Restore the hero beside the sedan so the player is not trapped inside it.
    if(BABYLON.Vector3.Distance(player.position,vehicle.position)<2.1){
      player.position.x=vehicle.position.x+2.2;
      player.position.z=vehicle.position.z;
    }
  }
  if(state.rescued&&state.missionIndex===1){
    survivorRoot.position.set(player.position.x,0,player.position.z+2.2);
  }
  if(Number.isFinite(savedGame?.yaw)){state.yaw=savedGame.yaw;camera.rotationOffset=180+state.yaw*180/Math.PI;}
  if(Number.isFinite(savedGame?.vehicleYaw))vehicle.rotation.y=savedGame.vehicleYaw;
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
    document.getElementById("use-water").disabled=state.inventory.water<1||state.thirst>=100;
    document.getElementById("use-food").disabled=state.inventory.food<1||state.hunger>=100;
  }
  function updateStorage(){
    for(const key of ["water","food","medicine","parts"]){
      document.getElementById("stash-"+key).textContent=String(state.stash[key]);
      document.getElementById("carry-"+key).textContent=String(state.inventory[key]);
    }
  }
  function closeStorage(){
    state.storageOpen=false;storagePanel.hidden=true;state.inventoryOpen=false;setPaused(false);
  }
  function openStorage(){
    if(state.paused||state.ended||driving)return;
    state.storageOpen=true;state.inventoryOpen=true;state.sprint=false;touchX=0;touchY=0;reset();
    storagePanel.hidden=false;setPaused(true);updateStorage();storageStatus.textContent="Supplies are stored safely at your base.";
  }
  document.getElementById("store-all").addEventListener("click",()=>{
    let moved=0;for(const key of ["water","food","medicine","parts"]){moved+=state.inventory[key];state.stash[key]+=state.inventory[key];state.inventory[key]=0;}
    updateInventory();updateStorage();saveProgress();storageStatus.textContent=moved?moved+" items stored.":"Your backpack is empty.";
  });
  document.getElementById("take-all").addEventListener("click",()=>{
    let moved=0;for(const key of ["water","food","medicine","parts"]){const room=Math.max(0,99-state.inventory[key]);const amount=Math.min(room,state.stash[key]);state.inventory[key]+=amount;state.stash[key]-=amount;moved+=amount;}
    updateInventory();updateStorage();saveProgress();storageStatus.textContent=moved?moved+" items moved to backpack.":"No stored items available or backpack is full.";
  });
  document.getElementById("close-storage").addEventListener("click",closeStorage);
  storageButton.addEventListener("click",openStorage);
  function consumeSupply(item){
    if(state.inventory[item]<1)return;
    if(item==="medicine"&&state.health<100){state.inventory.medicine--;state.health=Math.min(100,state.health+30);document.getElementById("health").style.width=state.health+"%";document.getElementById("status").textContent="Medicine used — health restored.";}
    else if(item==="water"&&state.thirst<100){state.inventory.water--;state.thirst=Math.min(100,state.thirst+48);state.stamina=Math.min(100,state.stamina+12);document.getElementById("thirst").style.width=state.thirst+"%";document.getElementById("stamina").style.width=state.stamina+"%";document.getElementById("status").textContent="Water consumed — hydration restored.";}
    else if(item==="food"&&state.hunger<100){state.inventory.food--;state.hunger=Math.min(100,state.hunger+42);state.stamina=Math.min(100,state.stamina+10);document.getElementById("hunger").style.width=state.hunger+"%";document.getElementById("stamina").style.width=state.stamina+"%";document.getElementById("status").textContent="Food consumed — hunger reduced.";}
    else return;
    updateInventory();saveProgress();
  }
  document.getElementById("use-medicine").addEventListener("click",()=>consumeSupply("medicine"));
  document.getElementById("use-water").addEventListener("click",()=>consumeSupply("water"));
  document.getElementById("use-food").addEventListener("click",()=>consumeSupply("food"));
  updateInventory();
  updateStorage();
  const inventoryButton=document.getElementById("inventory-button");
  inventoryButton.addEventListener("click",()=>{inventoryPanel.hidden=!inventoryPanel.hidden;state.inventoryOpen=!inventoryPanel.hidden;if(state.inventoryOpen){state.sprint=false;touchX=0;touchY=0;reset();saveProgress();}});
  const menuOverlay=document.getElementById("main-menu");
  const endOverlay=document.getElementById("end-overlay");
  const endTitle=document.getElementById("end-title");
  const endText=document.getElementById("end-text");
  if(state.safe){state.ended=true;endOverlay.hidden=false;endTitle.textContent=state.missionIndex===2?"CAMPAIGN COMPLETE":"MISSION 1 COMPLETE";endText.textContent=state.missionIndex===2?"The emergency network is online. The city can call for help.":"The shopkeeper and all supplies reached safety.";document.getElementById("retry-button").textContent=state.missionIndex===1?"NEXT MISSION":"RESTART CAMPAIGN";document.getElementById("message").textContent="Mission complete — safe zone secured!";document.getElementById("status").textContent="Safe zone secured. Progress saved."; }
  function saveProgress(){
    try{
      localStorage.setItem(SAVE_KEY,JSON.stringify({
        health:state.health,stamina:state.stamina,thirst:state.thirst,hunger:state.hunger,supplies:state.supplies,inventory:state.inventory,stash:state.stash,missionIndex:state.missionIndex,activatedRelays:state.activatedRelays,yaw:state.yaw,vehicleYaw:vehicle.rotation.y,missionComplete:state.safe,survivorRescued:state.rescued,fleet:fleet.map(v=>[v.root.position.x,v.root.position.y,v.root.position.z,v.root.rotation.y,v.fuel,v.condition,v.lightsOn?1:0]),
        player:[player.position.x,player.position.y,player.position.z],
        vehicle:[vehicle.position.x,vehicle.position.y,vehicle.position.z],
        collected:pickups.filter(p=>p.collected).map(p=>p.phase)
      }));
    }catch(error){console.warn("Save unavailable:",error);}
  }
  window.addEventListener("pagehide",saveProgress);
  fleet.forEach(item=>item.root.onCollideObservable.add(()=>{
    const now=performance.now();
    if(now-item.lastImpact>1100){item.lastImpact=now;item.condition=Math.max(0,item.condition-4);}
  }));
  let saveClock=0, damageTimer=0, survivalClock=0, touchX=0, touchY=0, verticalVelocity=0, grounded=true, jumpCooldown=0;
  // Read-only debug surface used by the automated browser smoke test.
  function getMovementVector(x,y){
    const forward=new BABYLON.Vector3(Math.sin(state.yaw),0,-Math.cos(state.yaw));
    const right=new BABYLON.Vector3(-forward.z,0,forward.x);
    return forward.scale(-y).add(right.scale(x));
  }
  window.__CVIRUS_DEBUG__={engine,scene,player,zombies,safe,state,heroRig,pickups,vehicle,vehicles:fleet,interiorRooms,survivorRoot,relayStations,safehouseCenter,serviceCenter,waterShots,get heroPose(){return {...heroAnimationSnapshot,bones:{...heroPoseValues}};},get heroModelReady(){return heroModelReady;},get heroModelError(){return heroModelError;},get heroBoneNames(){return [...heroBoneNodes.keys()];},get audioState(){return audioContext?.state||"uninitialized";},get touchState(){return {x:touchX,y:touchY,active};},get shield(){return heroShield;},moveVector:getMovementVector,get driving(){return driving;},get activeVehicle(){return activeVehicle;},get nearestVehicle(){return nearestVehicle();}};
  let worldClock=0;
  let heroWalkPhase=0,footstepClock=0;
  const heroPoseValues={};
  let heroAnimationSnapshot={moving:false,gait:0,phase:0};
  let subtitleTimer=null;
  const subtitlePanel=document.getElementById("subtitles");
  function showSubtitle(urdu,translation,duration=4200){
    document.getElementById("subtitle-urdu").textContent=urdu;
    document.getElementById("subtitle-translation").textContent=translation;
    subtitlePanel.hidden=false;
    if(subtitleTimer)clearTimeout(subtitleTimer);
    subtitleTimer=setTimeout(()=>{subtitlePanel.hidden=true;},duration);
  }
  document.getElementById("supply-pill").hidden=state.missionIndex===2;
  if(state.missionIndex===1){
    showSubtitle("شہر میں وائرس پھیل چکا ہے۔ دکاندار کو بچائیں اور سپلائی جمع کریں۔","The city is infected. Rescue the shopkeeper and collect supplies.",5200);
    setTimeout(()=>showSubtitle("ریڈیو: چاروں سپلائی کریٹس جمع کریں، پھر سبز محفوظ مقام پر جائیں۔","RADIO: Collect all four supply crates, then reach the green safe zone.",5200),5600);
  }else{
    showSubtitle("ہمیں ایمرجنسی ریڈیو نیٹ ورک بحال کرنا ہے۔","Restore the emergency radio network.",5200);
  }
  scene.onBeforeRenderObservable.add(()=>{
    if(state.paused||state.ended||state.inventoryOpen||state.serviceOpen)return;
    const dt=Math.min(engine.getDeltaTime()/1000,.04);
    worldClock+=dt;
    survivalClock+=dt;
    if(survivalClock>=1){
      const elapsed=Math.floor(survivalClock);survivalClock-=elapsed;
      if(!state.safe&&state.health>0){
        state.thirst=Math.max(0,state.thirst-.055*elapsed);
        state.hunger=Math.max(0,state.hunger-.032*elapsed);
        if(state.thirst===0||state.hunger===0)state.health=Math.max(0,state.health-.45*elapsed);
        document.getElementById("thirst").style.width=state.thirst+"%";
        document.getElementById("hunger").style.width=state.hunger+"%";
        document.getElementById("health").style.width=state.health+"%";
        updateInventory();
        if(state.thirst<20||state.hunger<20)document.getElementById("status").textContent=state.thirst<20?"Water is running low — find drinking water.":"Food is running low — find supplies.";
      }
    }
    waterGunCooldown=Math.max(0,waterGunCooldown-dt);
    for(let i=waterShots.length-1;i>=0;i--){
      const shot=waterShots[i],step=shot.direction.scale(28*dt);
      shot.mesh.position.addInPlace(step);shot.distance+=step.length();
      if(shot.target&&!shot.target.metadata.knockback&&BABYLON.Vector3.Distance(shot.mesh.position,shot.target.position)<.82){applyWaterKnockback(shot.target,shot.direction);shot.mesh.dispose();waterShots.splice(i,1);continue;}
      if(shot.distance>=shot.maxDistance){shot.mesh.dispose();waterShots.splice(i,1);}
    }
    const daylight=(Math.sin(worldClock/90*Math.PI*2-Math.PI/2)+1)/2;
    sun.intensity=.16+daylight*.72;
    light.intensity=.42+daylight*.52;
    scene.fogDensity=.0045+(1-daylight)*.0035;
    scene.clearColor=new BABYLON.Color4(.035+daylight*.45,.055+daylight*.60,.09+daylight*.67,1);
    saveClock+=dt;if(saveClock>=5){saveClock=0;saveProgress();}
    const moving=!driving&&state.moveX*state.moveX+state.moveY*state.moveY>.025;
    const sprinting=moving&&(state.sprint||keys.shift)&&!state.crouching&&state.stamina>1;
    const shieldActive=worldClock<state.shieldUntil;
    heroShield.setEnabled(shieldActive&&!driving);
    if(shieldActive)heroShield.rotation.y+=dt*1.35;
    shieldButton.hidden=driving||state.paused||state.ended;
    const shieldCooldown=Math.max(0,state.shieldCooldownUntil-worldClock);
    shieldButton.disabled=!shieldActive&&shieldCooldown>0;
    shieldButton.textContent=shieldActive?"SHIELD ON":shieldCooldown>0?"WAIT "+Math.ceil(shieldCooldown):"SHIELD";
    if(moving){footstepClock-=dt;if(footstepClock<=0){playFootstep(sprinting);footstepClock=sprinting?.255:.39;}}
    else footstepClock=Math.min(footstepClock,.08);
    const heroSpeed=sprinting?1.42:state.crouching?.62:1;
    heroWalkPhase+=dt*(sprinting?12.2:state.crouching?5.1:9.1);
    const heroPhase=heroWalkPhase;
    const gait=moving?Math.sin(heroPhase)*(sprinting?.88:state.crouching?.22:.62):Math.sin(worldClock*1.8)*.025;
    const airborne=!grounded&&verticalVelocity>0;
    heroAnimationSnapshot={moving,gait,phase:heroPhase,sprinting,airborne};
    if(heroModelReady){
      const crouch=state.crouching?1:0;
      const leftSwing=gait,rightSwing=-gait;
      const leftKnee=moving?Math.max(0,-Math.cos(heroPhase))*.92:0;
      const rightKnee=moving?Math.max(0,Math.cos(heroPhase))*.92:0;
      setIbrahimBone("thigh_l",leftSwing*.88+crouch*.30);
      setIbrahimBone("thigh_r",rightSwing*.88+crouch*.30);
      setIbrahimBone("calf_l",leftKnee+crouch*.72);
      setIbrahimBone("calf_r",rightKnee+crouch*.72);
      setIbrahimBone("foot_l",moving?-leftKnee*.22:0);
      setIbrahimBone("foot_r",moving?-rightKnee*.22:0);
      // Bend both elbows and keep the shoulders slightly relaxed instead of a stiff straight-arm pose.
      const armSwing=gait*.78;
      setIbrahimBone("upperarm_l",-armSwing+(airborne?-.48:crouch*-.18),0,-.10-Math.sin(heroPhase)*.045);
      setIbrahimBone("upperarm_r",armSwing+(airborne?-.48:crouch*-.18),0,.10+Math.sin(heroPhase)*.045);
      setIbrahimBone("lowerarm_l",.34+Math.max(0,gait)*.22,0,-.025);
      setIbrahimBone("lowerarm_r",.34+Math.max(0,-gait)*.22,0,.025);
      setIbrahimBone("hand_l",moving?-.04+gait*.08:0);setIbrahimBone("hand_r",moving?-.04-gait*.08:0);
      setIbrahimBone("clavicle_l",0,0,-.035+armSwing*.10);setIbrahimBone("clavicle_r",0,0,.035-armSwing*.10);
      setIbrahimBone("spine_01",moving?Math.sin(heroPhase*2)*.018:0,moving?gait*.035:0);
      setIbrahimBone("spine_02",crouch*.18+(airborne?-.06:Math.sin(worldClock*2)*.012),moving?-gait*.045:0);
      setIbrahimBone("spine_03",crouch*.08+(moving?gait*.045:Math.sin(worldClock*2)*.008));
      setIbrahimBone("head",airborne?-0.07:(crouch?0.08:Math.sin(worldClock*1.4)*0.012));
      if(heroModelRoot)heroModelRoot.position.y=-.95+(moving?Math.abs(Math.sin(heroPhase*2))*.035:Math.sin(worldClock*2)*.008);
    }else{
      heroRig.leftLeg.rotation.x=gait;heroRig.rightLeg.rotation.x=-gait;
      heroRig.leftArm.rotation.x=-gait*.72+(airborne?-.7:state.crouching?-.28:0);
      heroRig.rightArm.rotation.x=gait*.72+(airborne?-.7:state.crouching?-.28:0);
      heroRig.lowerLegs[0].rotation.x=Math.max(0,-gait)*.72+(state.crouching?.55:0);
      heroRig.lowerLegs[1].rotation.x=Math.max(0,gait)*.72+(state.crouching?.55:0);
      heroRig.lowerArms[0].rotation.x=.28+Math.max(0,gait)*.22;
      heroRig.lowerArms[1].rotation.x=.28+Math.max(0,-gait)*.22;
      torso.position.y=.13+(moving?Math.abs(gait)*.025:Math.sin(worldClock*2)*.012);
      head.rotation.x=airborne?-.08:state.crouching?.1:Math.sin(worldClock*1.4)*.012;
    }
    torso.rotation.x=state.crouching?.16:airborne?-.06:0;
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
        playCue("pickup");document.getElementById("status").textContent="Supplies collected: "+state.supplies+"/4 — reach the safe zone.";showSubtitle("سپلائی مل گئی۔ محفوظ مقام کی طرف بڑھیں۔","Supply secured. Keep moving toward the safe zone.",2200);
        saveProgress();
      }
    });
    // On-foot input is camera-relative. The follow camera sits behind the hero
    // on the -Z side at zero yaw, so joystick UP must travel toward -Z.
    // Vehicle throttle is handled separately below and is intentionally untouched.
    // Keep movement on the same orbit-yaw basis as the follow camera:
    // UP = forward, LEFT = camera-left, DOWN = backward, RIGHT = camera-right.
    const move=getMovementVector(state.moveX,state.moveY);
    if(move.lengthSquared()>1)move.normalize();
    jumpCooldown=Math.max(0,jumpCooldown-dt);
    if(move.lengthSquared()>0.001&&!state.safe&&state.health>0){move.normalize();player.rotation.y=Math.atan2(move.x,move.z);}
    if(driving){
      const throttle=state.braking?0:-state.moveY;
      setEngineAudio(!state.paused&&!state.ended,throttle);
      activeVehicle.rearLights.forEach(mesh=>{mesh.isVisible=state.braking;});
      if(Math.abs(throttle)>.08||Math.abs(state.moveX)>.08){
        if(activeVehicle.fuel<=0||activeVehicle.condition<=0){
          document.getElementById("status").textContent=activeVehicle.fuel<=0?"Out of fuel — visit the safe-house service bay.":"Vehicle needs repairs — visit the safe-house service bay.";
        }else{
          activeVehicle.fuel=Math.max(0,activeVehicle.fuel-dt*(Math.abs(throttle)>.08?1.35:.35));
          activeVehicle.root.rotation.y+=state.moveX*1.55*dt*(throttle<0?-1:1);
          const heading=new BABYLON.Vector3(Math.sin(activeVehicle.root.rotation.y),0,Math.cos(activeVehicle.root.rotation.y));
          const baseSpeed=state.sprint?10:activeVehicle.type==="MOTORCYCLE"?8.5:activeVehicle.type==="CHINGCHI"?5.4:activeVehicle.type==="4K BUS"?4.2:6.2;
          const driveSpeed=baseSpeed*(.35+.65*activeVehicle.condition/100);
          activeVehicle.root.moveWithCollisions(heading.scale(throttle*driveSpeed*dt));
        }
      }
      player.position.copyFrom(activeVehicle.root.position);
      hornButton.hidden=!driving||state.paused||state.ended;lightsButton.hidden=!driving||state.paused||state.ended;brakeButton.hidden=!driving||state.paused||state.ended;
      const vehicleStatus=document.getElementById("vehicle-status");
      vehicleStatus.hidden=!driving;
      document.getElementById("vehicle-fuel").style.width=activeVehicle.fuel+"%";
      document.getElementById("vehicle-condition").style.width=activeVehicle.condition+"%";
      document.getElementById("vehicle-fuel-label").textContent=Math.round(activeVehicle.fuel)+"%";
      document.getElementById("vehicle-condition-label").textContent=Math.round(activeVehicle.condition)+"%";
    }
    if(!driving)setEngineAudio(false);
    if(!driving&&!state.safe&&state.health>0){
      const wantsSprint=!state.crouching&&(state.sprint||keys.shift)&&move.lengthSquared()>.01&&state.stamina>1;
      if(wantsSprint)state.stamina=Math.max(0,state.stamina-27*dt);
      else state.stamina=Math.min(100,state.stamina+18*dt);
      const speed=state.crouching?2.45:wantsSprint?8.2:5.2;
      verticalVelocity-=19*dt;
      player.moveWithCollisions(new BABYLON.Vector3(move.x*speed*dt,verticalVelocity*dt,move.z*speed*dt));
      if(player.position.y<=.97&&verticalVelocity<=0){player.position.y=.95;verticalVelocity=0;grounded=true;}
      else if(player.position.y>.97){grounded=false;}
      const staminaBar=document.getElementById("stamina");
      if(staminaBar)staminaBar.style.width=state.stamina+"%";
    }
    // Rescued shopkeeper follows on foot and keeps up with the selected vehicle.
    // A small separation avoids overlap with the player while preserving the escort.
    if(state.rescued&&state.missionIndex===1&&survivorRoot.isEnabled()&&!state.safe){
      const carrier=driving?activeVehicle.root:player;
      const forward=new BABYLON.Vector3(Math.sin(carrier.rotation.y),0,Math.cos(carrier.rotation.y));
      const target=carrier.position.subtract(forward.scale(1.65));
      const delta=target.subtract(survivorRoot.position);delta.y=0;
      const distance=delta.length();
      if(distance>1.25){
        let direction=delta.normalize();
        const rayOrigin=survivorRoot.position.add(new BABYLON.Vector3(0,.8,0));
        const blocked=scene.pickWithRay(new BABYLON.Ray(rayOrigin,direction,1.8),mesh=>mesh!==survivorRoot&&mesh.checkCollisions&&mesh.name!=="ground"&&mesh.name!=="street");
        if(blocked&&blocked.hit){
          const side=new BABYLON.Vector3(-direction.z,0,direction.x);
          const left=direction.scale(.25).add(side.scale(.97)).normalize();
          const sideRay=new BABYLON.Ray(rayOrigin,left,1.8);
          const sideHit=scene.pickWithRay(sideRay,mesh=>mesh.checkCollisions&&mesh.name!=="ground"&&mesh.name!=="street");
          direction=sideHit&&sideHit.hit?new BABYLON.Vector3(-side.z,0,side.x):left;
        }
        const escortSpeed=driving?9.2:3.6;
        survivorRoot.position.addInPlace(direction.scale(Math.min(distance-1.25,escortSpeed*dt)));
        survivorRoot.position.y=0;
        survivorRoot.rotation.y=Math.atan2(direction.x,direction.z);
        const gait=Math.sin(performance.now()*.012)*.42;survivorRig.legs[0].rotation.x=gait;survivorRig.legs[1].rotation.x=-gait;survivorRig.arms[0].rotation.x=-gait*.55;survivorRig.arms[1].rotation.x=gait*.55;
      }else{survivorRig.legs.forEach(limb=>{limb.rotation.x=0;});survivorRig.arms.forEach(limb=>{limb.rotation.x=0;});}
    }
    let near=false;
    zombies.forEach((z,index)=>{
      const knockback=z.metadata.knockback;
      if(knockback){
        if(knockback.elapsed<knockback.flightDuration){
          knockback.elapsed=Math.min(knockback.flightDuration,knockback.elapsed+dt);
          z.position.x+=knockback.velocity.x*dt;z.position.z+=knockback.velocity.z*dt;
          const flight=knockback.elapsed/knockback.flightDuration;
          z.position.y=1+Math.sin(flight*Math.PI)*2.45;
          z.rotation.y+=knockback.spin*dt;z.rotation.x=-.24;z.rotation.z=Math.sin(flight*Math.PI*2)*.28;
          z.rig.leftArm.rotation.x=-1.12;z.rig.rightArm.rotation.x=-1.12;z.rig.leftLeg.rotation.x=.72;z.rig.rightLeg.rotation.x=-.72;z.rig.lowerArms.forEach(p=>p.rotation.x=.55);
          if(flight>=1){z.position.y=1;knockback.velocity.set(0,0,0);}
        }else{
          knockback.recovery-=dt;z.position.y=1;z.rotation.y=knockback.baseYaw;const blend=Math.max(0,knockback.recovery/.72);z.rotation.x=-.24*blend;z.rotation.z*=Math.max(0,1-dt*4);
          z.rig.leftArm.rotation.x=-.72*blend;z.rig.rightArm.rotation.x=-.72*blend;z.rig.leftLeg.rotation.x=.34*blend;z.rig.rightLeg.rotation.x=-.34*blend;z.rig.lowerArms.forEach(p=>p.rotation.x=.28*blend);
          if(knockback.recovery<=0){z.metadata.knockback=null;z.rotation.x=0;z.rotation.z=0;z.rig.leftArm.rotation.x=0;z.rig.rightArm.rotation.x=0;z.rig.leftLeg.rotation.x=0;z.rig.rightLeg.rotation.x=0;}
        }
        return;
      }
      if(state.safe||state.health<=0)return;
      const delta=player.position.subtract(z.position);delta.y=0;
      const dist=delta.length();
      const shieldPushing=shieldActive&&dist<4.7;
      let shieldDirection=null;
      if(shieldPushing){
        shieldDirection=z.position.subtract(player.position);shieldDirection.y=0;
        if(shieldDirection.lengthSquared()<.001)shieldDirection.set(index%2?1:0,0,index%2?0:1);
        shieldDirection.normalize();
        z.moveWithCollisions(new BABYLON.Vector3(shieldDirection.x*(4.7-dist)*2.6*dt,0,shieldDirection.z*(4.7-dist)*2.6*dt));
      }
      const chasing=!shieldPushing&&!driving&&dist>1.25&&dist<z.metadata.detectionRange*(state.crouching?0.58:1);
      let walkDirection=shieldDirection;
      if(chasing){
        let chase=delta.normalize();
        // Check the path at chest height and steer around collidable buildings,
        // room walls and props instead of walking straight through them.
        const origin=z.position.add(new BABYLON.Vector3(0,.78,0));
        const blocked=direction=>{
          const ray=new BABYLON.Ray(origin,direction,2.15);
          const hit=scene.pickWithRay(ray,mesh=>mesh!==z&&mesh.parent!==z&&mesh.checkCollisions&&mesh.name!=="ground"&&mesh.name!=="street");
          return !!(hit&&hit.hit);
        };
        if(blocked(chase)){
          const side=new BABYLON.Vector3(-chase.z,0,chase.x).scale(index%2===0?1:-1);
          const left=chase.scale(.28).add(side.scale(.96)).normalize();
          const right=chase.scale(.28).subtract(side.scale(.96)).normalize();
          if(!blocked(left))chase=left;
          else if(!blocked(right))chase=right;
          else chase=side;
        }
        walkDirection=chase;
        z.moveWithCollisions(new BABYLON.Vector3(chase.x*z.metadata.speed*dt,0,chase.z*z.metadata.speed*dt));
      }else if(!walkDirection&&!state.ended){
        // Unalerted walkers patrol nearby streets instead of standing frozen.
        z.metadata.wanderTimer-=dt;
        if(z.metadata.wanderTimer<=0){
          z.metadata.wanderAngle+=(Math.random()-.5)*2.2;
          z.metadata.wanderTimer=1.8+Math.random()*2.6;
        }
        walkDirection=new BABYLON.Vector3(Math.sin(z.metadata.wanderAngle),0,Math.cos(z.metadata.wanderAngle));
        const patrolOrigin=z.position.add(new BABYLON.Vector3(0,.78,0));
        const patrolRay=new BABYLON.Ray(patrolOrigin,walkDirection,1.7);
        const patrolHit=scene.pickWithRay(patrolRay,mesh=>mesh!==z&&mesh.parent!==z&&mesh.checkCollisions&&mesh.name!=="ground"&&mesh.name!=="street");
        if(patrolHit&&patrolHit.hit){
          z.metadata.wanderAngle+=Math.PI*(.55+Math.random()*.45);
          walkDirection=new BABYLON.Vector3(Math.sin(z.metadata.wanderAngle),0,Math.cos(z.metadata.wanderAngle));
        }
        z.moveWithCollisions(new BABYLON.Vector3(walkDirection.x*z.metadata.speed*.24*dt,0,walkDirection.z*z.metadata.speed*.24*dt));
      }
      if(walkDirection){
        z.rotation.y=Math.atan2(walkDirection.x,walkDirection.z);
        const phase=performance.now()*.007*(z.metadata.archetype==="SPRINTER"?1.22:z.metadata.archetype==="GUARDIAN"?.78:1)+z.metadata.phase;
        const stride=Math.sin(phase)*(chasing?.52:.24);
        const kneeLift=Math.max(0,Math.cos(phase))*(chasing?.78:.34);
        z.rig.leftLeg.rotation.x=stride;z.rig.rightLeg.rotation.x=-stride;
        z.rig.leftArm.rotation.x=-stride*.72+(chasing?-.12:.08);
        z.rig.rightArm.rotation.x=stride*.72+(chasing?-.12:.08);
        z.rig.lowerLegs[0].rotation.x=kneeLift;
        z.rig.lowerLegs[1].rotation.x=Math.max(0,-Math.cos(phase))*(chasing?.78:.34);
        z.rig.lowerArms[0].rotation.x=.12+Math.max(0,stride)*.28;
        z.rig.lowerArms[1].rotation.x=.12+Math.max(0,-stride)*.28;
        z.rig.torso.position.y=.08+Math.abs(Math.sin(phase*2))*.022;
        z.rig.torso.rotation.x=chasing?-.075:Math.sin(phase)*.018;
        z.rig.head.rotation.x=chasing?.045:Math.sin(phase*.5)*.025;
      }else{
        z.rig.leftLeg.rotation.x=0;z.rig.rightLeg.rotation.x=0;
        z.rig.leftArm.rotation.x=.08;z.rig.rightArm.rotation.x=.08;
        z.rig.lowerLegs.forEach(p=>p.rotation.x=0);
        z.rig.lowerArms.forEach(p=>p.rotation.x=.12);
        z.rig.torso.position.y=.08+Math.sin(performance.now()*.0018)*.008;
        z.rig.torso.rotation.x=0;z.rig.head.rotation.x=0;
      }
      if(dist<1.7)near=true;
    });
    if(near&&!shieldActive&&!driving&&!state.safe&&state.health>0){damageTimer+=dt;if(damageTimer>.45){playCue("alert");state.health=Math.max(0,state.health-3);damageTimer=0;document.getElementById("health").style.width=state.health+"%";}}
    else if(shieldActive)damageTimer=0;
    const nearest=nearestVehicle();
    hornButton.hidden=!driving||state.paused||state.ended;
    lightsButton.hidden=!driving||state.paused||state.ended;
    brakeButton.hidden=!driving||state.paused||state.ended;
    crouchButton.hidden=driving||state.paused||state.ended;
    waterGunButton.hidden=driving||state.paused||state.ended;
    waterGunButton.disabled=waterGunCooldown>0;
    waterGunButton.textContent=waterGunCooldown>0?"WATER "+waterGunCooldown.toFixed(1):"WATER GUN";
    if(driving){state.crouching=false;crouchButton.textContent="CROUCH";}
    vehiclePrompt.hidden=!driving&&nearest.distance>4.8;
    vehiclePrompt.textContent=driving?"Tap EXIT to leave "+activeVehicle.type:"Tap DRIVE to enter "+nearest.item.type;
    const serviceDistance=Math.hypot(player.position.x-serviceCenter.x,player.position.z-serviceCenter.z);
    serviceButton.hidden=driving||serviceDistance>5.2||nearest.distance>8||state.paused||state.ended;
    const baseDistance=BABYLON.Vector3.Distance(player.position,safehouseCenter);
    storageButton.hidden=driving||baseDistance>4.2||state.paused||state.ended;
    let nearestRoom=null,nearestDoor=Infinity,insideRoom=null;
    if(!driving){
      for(const room of interiorRooms){
        const doorDistance=BABYLON.Vector3.Distance(player.position,room.door);
        if(doorDistance<nearestDoor){nearestDoor=doorDistance;nearestRoom=room;}
        if(Math.abs(player.position.x-room.center.x)<2.15&&Math.abs(player.position.z-room.center.z)<3.05)insideRoom=room;
      }
    }
    buildingPrompt.hidden=driving||(!insideRoom&&(!nearestRoom||nearestDoor>3.2));
    buildingPrompt.textContent=insideRoom?insideRoom.type+" INTERIOR — EXPLORE":nearestRoom?nearestRoom.type+" — WALK INSIDE":"";
    const survivorDistance=BABYLON.Vector3.Distance(player.position,survivorRoot.position);
    let actionVisible=false;
    if(state.missionIndex===1){
      actionVisible=!state.rescued&&survivorDistance<=2.7;
      rescueButton.textContent="RESCUE";
      if(!state.rescued&&survivorDistance<8&&!driving)document.getElementById("message").textContent="Shopkeeper nearby — enter the general store to help.";
    }else{
      let nearestRelay=null,relayDistance=Infinity;
      for(const station of relayStations){if(station.active)continue;const distance=BABYLON.Vector3.Distance(player.position,station.root.position);if(distance<relayDistance){relayDistance=distance;nearestRelay=station;}}
      actionVisible=!!nearestRelay&&relayDistance<=3.1;
      rescueButton.textContent="ACTIVATE";
      if(!actionVisible)document.getElementById("status").textContent="Emergency network: "+state.activatedRelays.length+"/3 relays online.";
    }
    rescueButton.hidden=!actionVisible||driving||state.paused||state.ended;
    const reached=BABYLON.Vector3.Distance(driving?activeVehicle.root.position:player.position,safe.position)<3;
    const survivorAtSafe=state.missionIndex!==1||!state.rescued||Math.hypot(survivorRoot.position.x-safe.position.x,survivorRoot.position.z-safe.position.z)<6.5;
    const objectiveComplete=state.missionIndex===1?state.supplies===4&&state.rescued&&survivorAtSafe:state.activatedRelays.length===3;
    if(reached&&!state.safe&&objectiveComplete){
      state.safe=true;state.ended=true;
      document.getElementById("message").textContent="Mission objective secured — safe zone reached!";
      document.getElementById("status").textContent=state.missionIndex===1?"Mission 1 complete. Survivor and supplies secured.":"Campaign objective complete. Emergency network restored.";
      endTitle.textContent=state.missionIndex===1?"MISSION 1 COMPLETE":"CAMPAIGN COMPLETE";
      endText.textContent=state.missionIndex===1?"You secured all supplies and escorted the shopkeeper to safety.":"All three emergency radio relays are online. The city can call for help.";
      document.getElementById("retry-button").textContent=state.missionIndex===1?"NEXT MISSION":"RESTART CAMPAIGN";
      endOverlay.hidden=false;
      document.getElementById("supply-pill").hidden=state.missionIndex===2;
      showSubtitle(state.missionIndex===1?"ہم نے دکاندار کو بچا لیا، محفوظ مقام پہنچ گئے!":"ریڈیو نیٹ ورک بحال ہو گیا، مدد پہنچ سکتی ہے!","Safe zone secured.",5000);
      saveProgress();
    }else if(reached&&!state.safe){
      const missing=[];
      if(state.missionIndex===1){if(state.supplies<4)missing.push((4-state.supplies)+" supplies");if(!state.rescued)missing.push("rescue the shopkeeper");else if(!survivorAtSafe)missing.push("wait for the shopkeeper to reach you");}
      else if(state.activatedRelays.length<3)missing.push((3-state.activatedRelays.length)+" radio relays");
      document.getElementById("message").textContent="Safe zone locked — "+missing.join(" and ")+".";
      document.getElementById("status").textContent="Before extraction: "+missing.join(", ")+".";
    }
    if(state.health<=0&&!state.safe&&!state.ended){state.ended=true;document.getElementById("message").textContent="Health depleted — mission failed";document.getElementById("status").textContent="Mission failed. Retry to start again.";endTitle.textContent="MISSION FAILED";endText.textContent="Try a different route and collect the supplies.";endOverlay.hidden=false;}
  });
  // Keyboard controls
  const keys={};
  window.__CVIRUS_DEBUG__.keys=keys;
  const pauseOverlay=document.getElementById("pause-overlay");
  const pauseButton=document.getElementById("pause-button");
  const resumeButton=document.getElementById("resume-button");
  function setPaused(value){
    state.paused=!!value;pauseOverlay.hidden=!state.paused;
    if(state.paused){state.sprint=false;state.braking=false;state.crouching=false;crouchButton.textContent="CROUCH";touchX=0;touchY=0;reset();saveProgress();}
  }
  pauseButton.addEventListener("click",()=>setPaused(!state.paused));
  resumeButton.addEventListener("click",()=>setPaused(false));
  const continueButton=document.getElementById("continue-game");
  const newGameButton=document.getElementById("new-game");
  const mainMenuButton=document.getElementById("main-menu-button");
  const garageOverlay=document.getElementById("garage-menu");
  document.getElementById("open-garage").addEventListener("click",()=>{menuOverlay.hidden=true;garageOverlay.hidden=false;});
  document.getElementById("garage-back").addEventListener("click",()=>{garageOverlay.hidden=true;menuOverlay.hidden=false;});
  garageOverlay.querySelectorAll("[data-vehicle]").forEach(button=>button.addEventListener("click",()=>{
    const chosen=fleet.find(v=>v.type===button.dataset.vehicle);
    if(!chosen)return;
    activeVehicle=chosen;
    player.position.copyFrom(chosen.root.position);
    player.position.x+=chosen.type==="MOTORCYCLE"?1.4:chosen.type==="4K BUS"?2.3:chosen.type==="CHINGCHI"?1.9:1.8;
    player.position.y=.95;
    camera.lockedTarget=player;
    garageOverlay.hidden=true;menuOverlay.hidden=true;setPaused(false);
    document.getElementById("status").textContent="Garage selected: "+chosen.type+". Walk to the vehicle and tap DRIVE.";
  }));
  continueButton.disabled=!savedGame;
  continueButton.addEventListener("click",()=>{menuOverlay.hidden=true;setPaused(false);});
  newGameButton.addEventListener("click",()=>{
    try{localStorage.removeItem(SAVE_KEY);sessionStorage.setItem("cvirus-start-new","1");}catch{}
    window.location.reload();
  });
  mainMenuButton.addEventListener("click",()=>{
    saveProgress();setPaused(true);pauseOverlay.hidden=true;menuOverlay.hidden=false;
  });
  let startNewGame=false;
  try{startNewGame=sessionStorage.getItem("cvirus-start-new")==="1";if(startNewGame)sessionStorage.removeItem("cvirus-start-new");}catch{}
  if(startNewGame){menuOverlay.hidden=true;setPaused(false);}
  else{state.paused=true;menuOverlay.hidden=false;pauseOverlay.hidden=true;}
  document.getElementById("retry-button").addEventListener("click",()=>{
    if(state.safe&&state.missionIndex===1){
      state.missionIndex=2;state.safe=false;state.ended=false;state.activatedRelays=[];survivorRoot.setEnabled(false);document.getElementById("supply-pill").hidden=true;
      relayStations.forEach(item=>{item.active=false;item.root.setEnabled(true);});
      endOverlay.hidden=true;document.getElementById("message").textContent="Mission 2: Restore the emergency radio network.";
      document.getElementById("status").textContent="Activate all 3 radio relays across the city, then return to the safe zone.";
      showSubtitle("ہمیں شہر کا ایمرجنسی ریڈیو نیٹ ورک بحال کرنا ہے۔","Mission 2: Restore the emergency radio network.",4800);
      saveProgress();
    }else{localStorage.removeItem(SAVE_KEY);window.location.reload();}
  });
  const doJump=()=>{const canJump=grounded||(player.position.y<=1.18&&verticalVelocity<=0);if(canJump&&jumpCooldown===0&&!state.safe&&state.health>0&&!driving){verticalVelocity=7.2;grounded=false;jumpCooldown=.22;}};
  window.addEventListener("keydown",e=>{if(e.key.toLowerCase()==="h"&&driving){playCue("horn");return;}if(e.key.toLowerCase()==="l"&&driving){setVehicleLights(!activeVehicle.lightsOn);return;}if(e.key.toLowerCase()==="c"&&!state.paused&&!driving&&!state.ended){state.crouching=!state.crouching;crouchButton.textContent=state.crouching?"STAND":"CROUCH";return;}if(e.key.toLowerCase()==="e"){toggleVehicle();return;}if(e.key==="Escape"){if(!settingsPanel.hidden){closeSettings();return;}if(state.inventoryOpen){state.inventoryOpen=false;inventoryPanel.hidden=true;}else setPaused(!state.paused);return;}const key=e.key.toLowerCase();if(key==="i"){inventoryPanel.hidden=!inventoryPanel.hidden;state.inventoryOpen=!inventoryPanel.hidden;if(state.inventoryOpen){state.sprint=false;touchX=0;touchY=0;reset();saveProgress();}return;}if(state.paused||!inventoryPanel.hidden)return;if(["arrowup","arrowdown","arrowleft","arrowright"," "].includes(key))e.preventDefault();keys[key]=true;if(e.code==="Space")doJump();});
  window.addEventListener("keyup",e=>keys[e.key.toLowerCase()]=false);
  window.addEventListener("blur",()=>{for(const key in keys)keys[key]=false;state.sprint=false;});
  let smoothedMoveX=0,smoothedMoveY=0;
  engine.runRenderLoop(()=>{const keyX=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0);const keyY=(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0);const inputX=touchX!==0?touchX:keyX,inputY=touchY!==0?touchY:keyY;const frameDt=Math.min(engine.getDeltaTime()/1000,.05);const response=driving?1:1-Math.exp(-24*frameDt);smoothedMoveX+=(inputX-smoothedMoveX)*response;smoothedMoveY+=(inputY-smoothedMoveY)*response;if(Math.abs(smoothedMoveX)<.012)smoothedMoveX=0;if(Math.abs(smoothedMoveY)<.012)smoothedMoveY=0;state.moveX=driving?inputX:smoothedMoveX;state.moveY=driving?inputY:smoothedMoveY;scene.render();});
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
  // Right-side touch drag controls the follow camera independently from the left joystick.
  let look=null;
  canvas.addEventListener("pointerdown",e=>{
    if(e.clientX>innerWidth*.42&&!state.paused&&!state.inventoryOpen){
      look={id:e.pointerId,x:e.clientX,y:e.clientY};
      try{canvas.setPointerCapture(e.pointerId);}catch{}
      e.preventDefault();
    }
  });
  canvas.addEventListener("pointermove",e=>{
    if(!look||e.pointerId!==look.id)return;
    const dx=e.clientX-look.x,dy=e.clientY-look.y;
    state.yaw-=dx*.006*audioSettings.look;
    camera.rotationOffset=180+state.yaw*180/Math.PI;
    camera.heightOffset=BABYLON.Scalar.Clamp(camera.heightOffset+dy*.018*audioSettings.look,2.2,5.5);
    look={id:e.pointerId,x:e.clientX,y:e.clientY};
    e.preventDefault();
  });
  const stopLook=e=>{if(look&&e.pointerId===look.id)look=null;};
  canvas.addEventListener("pointerup",stopLook);
  canvas.addEventListener("pointercancel",stopLook);
  canvas.addEventListener("lostpointercapture",stopLook);
  canvas.addEventListener("wheel",e=>{camera.radius=BABYLON.Scalar.Clamp(camera.radius+Math.sign(e.deltaY)*.7,5,12);},{passive:true});
  document.addEventListener("visibilitychange",()=>{if(document.hidden){state.sprint=false;touchX=0;touchY=0;reset();}else{const ctx=initAudio();if(ctx&&ctx.state==="suspended")ctx.resume().catch(()=>{});}});
  window.addEventListener("resize",()=>engine.resize());
})();
